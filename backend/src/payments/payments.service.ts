import { Injectable } from '@nestjs/common';
import axios from 'axios';
import crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private api = 'https://sandbox.przelewy24.pl/api/v1';

    private merchantId = Number(process.env.P24_MERCHANT_ID);
    private posId = Number(process.env.P24_POS_ID);
    private crc = process.env.P24_CRC!;
    private reportKey = process.env.P24_REPORT_KEY!;

    private generateSign(
        sessionId: string,
        amount: number,
        currency: string
    ): string {
        const data =
            `{"sessionId":"${sessionId}",` +
            `"merchantId":${this.merchantId},` +
            `"amount":${amount},` +
            `"currency":"${currency}",` +
            `"crc":"${this.crc}"}`;

        return crypto
            .createHash('sha384')
            .update(data, 'utf8')
            .digest('hex');
    }

    async createTransaction(amountPln: number) {
        const amount = Math.round(amountPln * 100); // grosze
        const sessionId = `sess_${Date.now()}`;

        const sign = this.generateSign(sessionId, amount, 'PLN');

        const payload = {
            merchantId: this.merchantId,
            posId: this.posId,
            sessionId,
            amount,
            currency: 'PLN',
            description: 'Test płatności sandbox',
            email: 'test@test.pl',
            country: 'PL',
            language: 'pl',
            urlReturn: 'https://example.com/return',
            urlStatus: 'https://example.com/status',
            sign
        };

        const response = await axios.post(
            `${this.api}/transaction/register`,
            payload,
            {
                auth: {
                    username: String(this.merchantId),
                    password: this.reportKey
                }
            }
        );

        return response.data;
    }
}