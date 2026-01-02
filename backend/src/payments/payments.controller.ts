import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('google-pay')
    async googlePay(
        @Body('token') googlePayToken: string,
        @Body('amount') amount: string,
        @Body('currency') currency: string
    ) {
        return this.paymentsService.createGooglePayTransaction(
            googlePayToken,
            amount,
            currency
        );
    }
}