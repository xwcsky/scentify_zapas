import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('pay')
    async pay(@Body() body: { amount: number }) {
        try {
            const result = await this.paymentsService.createTransaction(body.amount);

            return {
                ok: true,
                result
            };

        } catch (err: any) {
            return {
                ok: false,
                debug: {
                    payload: err.debugPayload,
                    sign: err.debugSign,
                    status: err?.response?.status,
                    data: err?.response?.data
                }
            };
        }
    }
}