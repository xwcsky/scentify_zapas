import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GooglePayService {
  createPaymentRequest(amount: string, currency = 'PLN'): any {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,

      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'przelewy24',
              gatewayMerchantId: 'sandbox'
            }
          }
        }
      ],

      merchantInfo: {
        merchantName: 'Sandbox Shop'
      },

      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount,
        currencyCode: currency
      },

      // 🔴 WYMAGANE
      callbackIntents: ['PAYMENT_AUTHORIZATION']
    };
  }
}
