import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GooglePayButtonModule } from '@google-pay/button-angular'; // 👈 IMPORT BIBLIOTEKI
import { GooglePayService } from '../../services/google-pay.service';

@Component({
  selector: 'app-google-pay-button',
  standalone: true,
  imports: [CommonModule, GooglePayButtonModule], // 👈 MUSI TU BYĆ
  templateUrl: './google-pay-button.component.html',
  styleUrls: ['./google-pay-button.component.scss']
})
export class GooglePayButtonComponent implements OnInit {
  @Input() price: string = '0.00';
  
  // Wysyłamy token do rodzica
  @Output() paymentSuccess = new EventEmitter<string>(); 
  @Output() paymentError = new EventEmitter<any>();

  // Obiekt konfiguracyjny dla guzika
  paymentRequest!: google.payments.api.PaymentDataRequest;

  constructor(private googlePayService: GooglePayService) {}

  ngOnInit(): void {
    // Tworzymy konfigurację na starcie
    this.updatePaymentRequest();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['price']) {
      console.log('💰 Cena zaktualizowana:', this.price);
      this.updatePaymentRequest();
    }
  }

  private updatePaymentRequest() {
    this.paymentRequest = this.googlePayService.createPaymentRequest(this.price);
  }

  // Ta metoda uruchomi się automatycznie, gdy Google zwróci dane
  onLoadPaymentData(event: any) {
    console.log('📦 Google Pay Data received:', event);

    // 👇 POPRAWKA: Obsługa sytuacji, gdy dane są w 'event.detail'
    const paymentData = event.detail || event;

    if (paymentData && paymentData.paymentMethodData) {
      const token = paymentData.paymentMethodData.tokenizationData.token;
      console.log('🔑 Token extracted:', token);
      this.paymentSuccess.emit(token);
    } else {
      console.error('❌ Błąd struktury danych Google Pay. Otrzymano:', event);
      this.paymentError.emit(new Error('Invalid payment data structure'));
    }
  }

  onError(event: any) {
    console.error('Google Pay Error:', event);
    this.paymentError.emit(event);
  }
}