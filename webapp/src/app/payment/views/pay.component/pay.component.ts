import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { GooglePayButtonComponent } from '../../components/google-pay-button/google-pay-button.component';
import { ApplePayButtonComponent } from '../../components/apple-pay-button/apple-pay-button.component';
import { SocketService } from '../../../common/services/socket.service';
import { OrdersApiService } from '../../../shop/services/orders-api.service';
import { PaymentsApiService } from '../../services/payments-api.service';
import { OSType } from '../../../common/model/enums';

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [CommonModule, GooglePayButtonComponent, ApplePayButtonComponent],
  templateUrl: './pay.component.html',
  styleUrl: './pay.component.scss'
})
export class PayComponent implements OnInit, OnDestroy {
  // 👇 PRZYWRACAMY ZMIENNE SYSTEMOWE
  system: OSType | undefined;
  protected readonly OSType = OSType; // Żeby HTML widział enuma

  scentId: string = '';
  deviceId: string = '';
  orderId: string = '';
  discountCode: string = '';
  quantity: number = 1;
  finalPrice: string = '0.00';
  isLoading: boolean = false;
  private socketSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private ordersApi: OrdersApiService,
    private paymentsApi: PaymentsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 👇 WYKRYWANIE SYSTEMU NA STARCIE
    this.system = this.detectMobileOS();

    this.route.queryParams.subscribe(params => {
        this.scentId = params['scentId'];
        this.deviceId = params['deviceId'];
        this.discountCode = params['discountCode'] || '';
        this.quantity = params['quantity'] ? Number(params['quantity']) : 1;

        if (this.scentId && this.deviceId) {
            this.createAndListen(this.scentId, this.deviceId, this.quantity, this.discountCode);
        }
    });
  }

  // 👇 TWOJA LOGIKA WYKRYWANIA
  detectMobileOS(): OSType {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) return OSType.Android;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return OSType.iOS;
    return OSType.Other;
  }

  // --- Reszta metod bez zmian (createAndListen, onGooglePaySuccess itp.) ---

  createAndListen(scentId: string, deviceId: string, quantity: number, discountCode?: string) {
    this.isLoading = true;
    this.ordersApi.createOrder({ scentId, deviceId, quantity, discountCode }).subscribe({
        next: (order: any) => {
            this.orderId = order.id;
            if (order.amount) this.finalPrice = Number(order.amount).toFixed(2);
            this.isLoading = false;
            this.cdr.detectChanges();
            if (order.status === 'PAID') {
               this.router.navigate(['/payment/confirm'], { queryParams: { orderId: this.orderId } });
               return;
            }
            this.listenForSuccess();
        },
        error: () => {
          this.finalPrice = 'Błąd';
          this.isLoading = false;
        }
    });
  }

  onGooglePaySuccess(token: string): void {
    this.isLoading = true;
    this.paymentsApi.processGooglePay(this.orderId, token).subscribe({
      next: () => {
        this.router.navigate(['/payment/confirm'], { queryParams: { orderId: this.orderId } });
      },
      error: (error) => {
        console.error('Błąd GPay:', error);
        alert('Płatność odrzucona lub błąd połączenia.');
        this.isLoading = false;
      }
    });
  }

  initiateP24Payment(): void {
    if (!this.orderId) return;
    this.isLoading = true;
    this.paymentsApi.startP24Payment(this.orderId).subscribe({
      next: (res) => {
        if (res?.redirectUrl) {
          window.location.href = res.redirectUrl;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  listenForSuccess() {
      this.socketService.joinOrderRoom(this.orderId);
      this.socketSub = this.socketService.onOrderStatus().subscribe((data) => {
          if (data.status === 'PAID') {
              this.router.navigate(['/payment/confirm'], { queryParams: { orderId: this.orderId } });
          }
      });
  }

  ngOnDestroy(): void {
      if (this.socketSub) this.socketSub.unsubscribe();
      this.socketService.disconnect();
  }
}
