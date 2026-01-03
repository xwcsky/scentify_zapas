import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GooglePayButtonModule } from '@google-pay/button-angular';
import { GooglePayService } from '../../services/google-pay.service';
import {ConfigurationService} from '../../../common/services/configuration.service';

@Component({
  selector: 'app-google-pay-button',
  standalone: true,
  imports: [GooglePayButtonModule],
  templateUrl: './google-pay-button.component.html'
})
export class GooglePayButtonComponent implements OnInit {
  paymentRequest!: any;

  private readonly API_URL = ConfigurationService.getApiUrl();

  constructor(
    private googlePay: GooglePayService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.paymentRequest =
      this.googlePay.createPaymentRequest('1.00', 'PLN');
  }

  onPaymentAuthorized: google.payments.api.PaymentAuthorizedHandler =
    () => {
      return new Promise<google.payments.api.PaymentAuthorizationResult>(
        (resolve) => {

          // this.http.post('/api/payments/pay', { amount: 10 }).subscribe(res => {
          //   window.location.href = res.redirectUrl;
          // });
          this.http.post(`${this.API_URL}/payments/pay`, { amount: 10 })
            .subscribe({
              next: () =>
                resolve({ transactionState: 'SUCCESS' }),
              error: () =>
                resolve({ transactionState: 'ERROR' })
            });
        }
      );
    };
}
