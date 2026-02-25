import { Controller, Post, Body, HttpCode, NotFoundException, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { P24Service } from './p24.service';

@Controller('payments')
export class PaymentsController {
  private logger = new Logger('PaymentsController');

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly p24Service: P24Service
  ) {}

  // 1. Google Pay (Token)
  @Post('google-pay')
  async handleGooglePay(@Body() body: { orderId: string, token: string }) {
    this.logger.log(`[GooglePay] Przetwarzanie tokenu dla: ${body.orderId}`);

    const allOrders = await this.ordersService.findAll();
    const order = allOrders.find(o => o.id === body.orderId);

    if (!order) throw new NotFoundException('Nie znaleziono zamówienia');

    const amountInGrosze = Math.round(Number(order.amount) * 100);
    
    // Przekazujemy token do P24
    await this.p24Service.processGooglePayTransaction(
      amountInGrosze,
      order.id, 
      'klient@vendx.pl',
      body.token
    );

    const p24Token = await this.p24Service.processGooglePayTransaction(
      amountInGrosze,
      order.id, 
      'klient@vendx.pl',
      body.token
    );

    this.logger.log(`[GooglePay] P24 przyjęło token (ID: ${p24Token}). Wymuszam status PAID i uruchamiam maszynę.`);

    await this.ordersService.confirmPayment(
      order.id,          // ID Zamówienia
      p24Token,          // Token z P24 jako ID Transakcji
      Number(order.amount)
  );
    
    return { 
      status: 'PAID',
      success: true,
      token: p24Token,
     };
  }

  // 2. Start P24 (Zwykłe przekierowanie)
  @Post('p24/start')
  async startP24Payment(@Body() body: { orderId: string }) {
    const allOrders = await this.ordersService.findAll();
    const order = allOrders.find(o => o.id === body.orderId);
    if (!order) throw new NotFoundException('Nie znaleziono zamówienia');

    const amountInGrosze = Math.round(Number(order.amount) * 100);
    
    // Rejestracja w P24
    const token = await this.p24Service.registerTransaction(
      amountInGrosze,
      order.id,
      'klient@vendx.pl'
    );

    return { redirectUrl: `https://sandbox.przelewy24.pl/trnRequest/${token}` };
  }

  // 3. Webhook (Powiadomienie z P24)
  @Post('p24/notification')
  @HttpCode(200)
  async handleNotification(@Body() body: any) {
    this.logger.log(`🔔 Otrzymano powiadomienie z P24: ${JSON.stringify(body)}`);
    try {
      await this.p24Service.verifyTransaction(body);
      
      await this.ordersService.confirmPayment(
        body.sessionId,      
        String(body.orderId) 
    );
      
      return 'OK';
    } catch (error) {
      this.logger.error('Błąd weryfikacji', error);
      throw error;
    }
  }
}