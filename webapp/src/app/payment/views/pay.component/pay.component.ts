import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { GooglePayButtonComponent } from '../../components/google-pay-button/google-pay-button.component';
import { ApplePayButtonComponent } from '../../components/apple-pay-button/apple-pay-button.component'; // Upewnij się, że masz ten import!
import { SocketService } from '../../../common/services/socket.service';
import { OrdersApiService } from '../../../shop/services/orders-api.service';
import { environment } from '../../../../environments/environment';
// 👇 IMPORT ENUMA
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
    private cdr: ChangeDetectorRef,
    private http: HttpClient
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
        error: (err) => {
          this.finalPrice = 'Błąd';
          this.isLoading = false; 
        }
    });
  }

  async onGooglePaySuccess(token: string) {
    this.isLoading = true;
    try {
      // 👇 ZMIANA: Przypisujemy odpowiedź do zmiennej 'response'
      const response: any = await this.http.post(`${environment.apiUrl}/payments/google-pay`, {
        orderId: this.orderId,
        token: token
      }).toPromise();

      console.log('Backend przyjął płatność GPay, przenoszę do confirm...');

      this.router.navigate(['/payment/confirm'], { queryParams: { orderId: this.orderId } });
      
    } catch (error) {
      console.error('Błąd GPay:', error);
      alert('Płatność odrzucona lub błąd połączenia.');
      this.isLoading = false;
    }
  }
  // Fallback dla BLIK/Apple Pay (jeśli Apple Pay nie ma natywnego wdrożenia)
  async initiateP24Payment() {
    if (!this.orderId) return;
    this.isLoading = true;
    try {
      const res = await this.http.post<any>(`${environment.apiUrl}/payments/p24/start`, { orderId: this.orderId }).toPromise();
      if (res && res.redirectUrl) window.location.href = res.redirectUrl;
    } catch (e) {
      this.isLoading = false;
    }
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