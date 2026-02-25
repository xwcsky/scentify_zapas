import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationService } from '../../common/services/configuration.service';

export interface DiscountCode {
  id: string;
  code: string;
  percent: number;
  maxUsages: number;
  usedCount: number;
  active: boolean;
  createdAt?: string;
}

export interface CreateDiscountDto {
  code: string;
  percent: number;
  maxUsages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountsApiService {
  private readonly API_URL = ConfigurationService.getApiUrl() + '/discounts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DiscountCode[]> {
    return this.http.get<DiscountCode[]>(this.API_URL);
  }

  create(dto: CreateDiscountDto): Observable<DiscountCode> {
    return this.http.post<DiscountCode>(this.API_URL, dto);
  }

  toggleStatus(id: string): Observable<DiscountCode> {
    return this.http.patch<DiscountCode>(`${this.API_URL}/${id}/status`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
