import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Definiujemy interfejsy, żeby TypeScript wiedział, jak wyglądają nasze dane
export interface DeviceSlot {
  id: number;
  slot_number: number;
  current_ml: number;
  capacity_ml: number;
  cologne: {
    cologne_name: string;
    brand_name: string;
    image_url: string;
  };
}

export interface Device {
  id: string;
  name: string;
  location: string;
  status: string;
  lastSeen: string;
  slots: DeviceSlot[];
}

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private apiUrl = `${environment.apiUrl}/devices`;

  constructor(private http: HttpClient) {}

  // Pobiera listę wszystkich maszyn
  getAllDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  // Odnawia płyn w danym slocie (strzela do naszego PATCH /devices/slots/:id/refill)
  refillSlot(slotId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/slots/${slotId}/refill`, {});
  }

  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/orders`);
  }
}