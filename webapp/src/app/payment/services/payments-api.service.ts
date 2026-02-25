import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationService } from '../../common/services/configuration.service';

export interface GooglePayResponse {
  status: string;
  success: boolean;
  token?: string;
}

export interface P24StartResponse {
  redirectUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsApiService {
  private readonly API_URL = ConfigurationService.getApiUrl() + '/payments';

  constructor(private http: HttpClient) {}

  processGooglePay(orderId: string, token: string): Observable<GooglePayResponse> {
    return this.http.post<GooglePayResponse>(`${this.API_URL}/google-pay`, {
      orderId,
      token
    });
  }

  startP24Payment(orderId: string): Observable<P24StartResponse> {
    return this.http.post<P24StartResponse>(`${this.API_URL}/p24/start`, {
      orderId
    });
  }
}
