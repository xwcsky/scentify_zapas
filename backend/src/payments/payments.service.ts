import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async markAsPaid(orderId: string, transactionId?: string) {
    this.logger.log(`💰 Potwierdzono płatność dla zamówienia: ${orderId}`);

    try {
        const updatedOrder = await this.prisma.orders.update({
          where: { id: orderId },
          data: { 
              status: 'PAID',
              transaction_id: transactionId || `P24_${Date.now()}`
          }
        });

        // 👇 POPRAWKA: Przekazujemy sam string 'PAID', a nie obiekt
        this.eventsGateway.notifyOrderUpdate(orderId, 'PAID');

        return updatedOrder;
    } catch (e) {
        this.logger.error(`Nie udało się oznaczyć zamówienia ${orderId} jako opłacone`, e);
        throw e;
    }
  }
}