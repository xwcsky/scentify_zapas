import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class P24Service {
  private logger = new Logger(P24Service.name);
  
  // Konwersja na Number, żeby uniknąć problemów z typami
  private merchantId = Number(process.env.P24_MERCHANT_ID) || 0;
  private posId = Number(process.env.P24_POS_ID) || this.merchantId;
  private crc = process.env.P24_CRC || ''; 
  private reportKey = process.env.P24_REPORT_KEY || ''; 
  private sandbox = true; 

  private get baseUrl() {
    return this.sandbox 
      ? 'https://sandbox.przelewy24.pl/api/v1' 
      : 'https://secure.przelewy24.pl/api/v1';
  }

  // 👇 1. NOWOŚĆ: Wydzielona funkcja generowania podpisu (dokładnie jak w działającym kodzie)
  private generateSign(sessionId: string, amount: number, currency: string = 'PLN'): string {
    const signString = 
      `{"sessionId":"${sessionId}",` +
      `"merchantId":${this.merchantId},` +
      `"amount":${amount},` +
      `"currency":"${currency}",` +
      `"crc":"${this.crc}"}`;

    return crypto
      .createHash('sha384')
      .update(signString, 'utf8') // Dodane 'utf8' dla pewności
      .digest('hex');
  }

  // 1. Google Pay
  async processGooglePayTransaction(amount: number, sessionId: string, email: string, token: string) {
    // Generujemy podpis nową metodą
    const sign = this.generateSign(sessionId, amount, 'PLN');
    const urlStatus = `${process.env.APP_URL}/payments/p24/notification`; // Wyciągam do zmiennej
    this.logger.log(`[P24] Rejestruję GPay. URL powiadomień to: ${urlStatus}`);

    const payload = {
      merchantId: this.merchantId,
      posId: this.posId,
      sessionId: sessionId,
      amount: amount,
      currency: 'PLN',
      description: 'Zamówienie VendX',
      email: email,
      country: 'PL',
      language: 'pl',
      // Tutaj zostawiamy Twoje poprawne URL-e z process.env
      urlReturn: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment/confirm`, 
      urlStatus: urlStatus,
      sign: sign,
      method: 166, 
      methodRefId: token 
    };

    this.logger.log(`[GPay START] Próba obciążenia tokenu. SessionId: ${sessionId}`);
    this.logger.log(`[GPay DEBUG] URL powiadomień: ${urlStatus}`);

   try {
      const auth = {
          username: String(this.merchantId),
          password: this.reportKey
      };

      // Wysyłamy żądanie
      const response = await axios.post(`${this.baseUrl}/transaction/register`, payload, {
        auth: auth
      });

      // Sukces - P24 przyjęło token
      this.logger.log(`[GPay SUKCES] Odpowiedź P24: ${JSON.stringify(response.data)}`);
      return response.data.data.token;

    } catch (e: any) {
      // 👇👇👇 TO JEST KLUCZOWE - LOGOWANIE BŁĘDU 👇👇👇
      this.logger.error(`[GPay BŁĄD] Status HTTP: ${e.response?.status}`);
      
      // Często błąd jest głębiej w obiekcie response
      if (e.response?.data) {
         this.logger.error(`[GPay BŁĄD] Treść błędu z P24: ${JSON.stringify(e.response.data)}`);
      } else {
         this.logger.error(`[GPay BŁĄD] Inny błąd: ${e.message}`);
      }
      
      throw new Error('Błąd płatności P24 Google Pay');
    }
  }

  // 2. Weryfikacja (tutaj też używamy nowej metody podpisu dla spójności)
  async verifyTransaction(payload: any) {
    // 1. Wyciągamy dane z powiadomienia
    const { sessionId, amount, orderId, currency } = payload;
    
    // Logujemy, że coś przyszło
    this.logger.log(`[Verify] Weryfikuję sesję: ${sessionId}, OrderID: ${orderId}`);

    // 2. Budujemy obiekt, który wyślemy do P24 w celu potwierdzenia
    // P24 wymaga, żebyśmy wysłali im "podpis" tego zapytania.
    // Liczymy go TU I TERAZ, żeby na 100% pasował do tego, co wysyłamy.
    
    const safeAmount = Number(amount);
    const safeOrderId = Number(orderId);
    
    // Wzór podpisu dla metody Verify:
    // {"sessionId":"...","orderId":...,"amount":...,"currency":"...","crc":"..."}
    const signString = `{"sessionId":"${sessionId}","orderId":${safeOrderId},"amount":${safeAmount},"currency":"${currency}","crc":"${this.crc}"}`;
    
    const verifySign = crypto.createHash('sha384').update(signString, 'utf8').digest('hex');

    const verifyPayload = {
      merchantId: this.merchantId,
      posId: this.posId,
      sessionId: sessionId,
      amount: safeAmount,
      currency: currency,
      orderId: safeOrderId,
      sign: verifySign // Wysyłamy im ten świeżo wyliczony podpis
    };

    try {
        // 3. Uderzamy do API P24
        // To jest moment prawdy. Jeśli to przejdzie, transakcja jest OK.
        await axios.put(`${this.baseUrl}/transaction/verify`, verifyPayload, {
            auth: {
                username: String(this.merchantId),
                password: this.reportKey
            }
        });
        
        this.logger.log(`[Verify] ✅ Sukces! P24 potwierdziło transakcję w API.`);
        return true; 

    } catch (e: any) {
        // Jeśli P24 zwróci błąd tutaj, to znaczy że albo dane są złe, albo CRC jest złe
        this.logger.error(`[Verify] ❌ Błąd weryfikacji w API P24: ${e.message}`, e.response?.data);
        
        // Ważne: rzucamy błąd, żeby nie oznaczyć zamówienia jako opłacone!
        throw new Error('P24 Transaction Verification Failed');
    }
  }

  // 3. Zwykłe przekierowanie
  async registerTransaction(amount: number, sessionId: string, email: string) {
     // 👇 Użycie nowej funkcji podpisu
     const sign = this.generateSign(sessionId, amount, 'PLN');
     const urlStatus = `${process.env.APP_URL}/payments/p24/notification`; // Wyciągam do zmiennej
     this.logger.log(`[P24] Rejestruję transakcję. URL powiadomień to: ${urlStatus}`);

     const payload = {
      merchantId: this.merchantId,
      posId: this.posId,
      sessionId: sessionId,
      amount: amount,
      currency: 'PLN',
      description: 'Zamówienie VendX',
      email: email,
      country: 'PL',
      language: 'pl',
      urlReturn: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment/confirm`, 
      urlStatus: urlStatus,
      sign: sign
    };

    // 👇 Zmiana auth na obiekt
    const response = await axios.post(`${this.baseUrl}/transaction/register`, payload, {
        auth: {
            username: String(this.merchantId),
            password: this.reportKey
        }
    });
    return response.data.data.token;
  }
}