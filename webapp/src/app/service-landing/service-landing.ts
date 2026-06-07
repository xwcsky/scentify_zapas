import { Component } from '@angular/core';
// Zaimportuj swój serwis (ścieżka zależy od Twoich folderów)
import { PaymentService } from '../services/payment.service'; 

@Component({
  selector: 'app-service-landing',
  templateUrl: './service-landing.html',
  styleUrls: ['./service-landing.css']
})
export class ServiceLandingComponent {

  // Wstrzyknięcie serwisu płatności
  constructor(private paymentService: PaymentService) {}

  payWithApplePay() {
    // Odpalamy testową płatność dla Apple (np. 149 PLN)
    // Zastąp to dokładną funkcją, którą masz już napisaną do perfum!
    this.paymentService.initiateApplePay(149.00, 'Konsultacja Olfaktoryczna - Św. Ducha');
  }
}