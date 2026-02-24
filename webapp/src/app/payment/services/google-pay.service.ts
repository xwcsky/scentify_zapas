import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GooglePayService {
  
  // Konfiguracja Przelewy24
  private readonly tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      'gateway': 'przelewy24',
      'gatewayMerchantId': '370550' // ⚠️ WPISZ TU SWÓJ POS ID (np. 123456)
    }
  };

  private readonly baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
      allowedCardNetworks: ['MASTERCARD', 'VISA']
    }
  };

  private readonly cardPaymentMethod = {
    type: 'CARD',
    tokenizationSpecification: this.tokenizationSpecification,
    parameters: {
      ...this.baseCardPaymentMethod.parameters,
      billingAddressRequired: true,
      billingAddressParameters: { format: 'MIN' }
    }
  };

  // 👇 TA METODA JEST POTRZEBNA DLA OFICJALNEGO GUZIKA
  createPaymentRequest(price: string) {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [this.cardPaymentMethod],
      merchantInfo: {
        merchantName: 'VendX',
        merchantId: '370550' // Wymagane na Produkcji
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: price,
        currencyCode: 'PLN',
        countryCode: 'PL'
      }
    } as google.payments.api.PaymentDataRequest;
  }
}