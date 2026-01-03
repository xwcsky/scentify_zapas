import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('pay')
    async pay(@Body() body: { amount: number }) {
        return this.paymentsService.createTransaction(body.amount);
    }
}