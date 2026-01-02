import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymentsService {
    private api = process.env.P24_API!;
    private login = process.env.P24_LOGIN!;
    private secretId = process.env.P24_SECRET_ID!;

    async createGooglePayTransaction(
        googlePayToken: string,
        amount: string,
        currency: string
    ) {
        const amountInt = Math.round(parseFloat(amount) * 100);

        const payload = {
            amount: amountInt,
            currency,
            description: 'Google Pay APay Sandbox',
            type: 'googlepay',

            cardData: {
                means: {
                    xPayPayload: googlePayToken
                }
            }
        };

        const response = await axios.post(
            `${this.api}/apay/transactions`,
            payload,
            {
                auth: {
                    username: this.login,
                    password: this.secretId
                }
            }
        );

        return {
            success: true,
            data: response.data
        };
    }
}