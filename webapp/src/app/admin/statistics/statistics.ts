import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { forkJoin } from 'rxjs'; 

import { DevicesService, Device } from '../services/devices';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, FormsModule],
  templateUrl: './statistics.html'
})
export class StatisticsComponent implements OnInit {
  devices: Device[] = [];
  orders: any[] = []; 
  selectedDeviceId: string = 'ALL';

  bestseller: string = 'Brak danych';
  totalDispenses: number = 0;
  totalRevenue: number = 0;

  // WYKRES SŁUPKOWY
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], datasets: [{ data: [], label: 'Wydane ml', backgroundColor: '#0d6efd', borderRadius: 4 }]
  };
  public barChartOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  // WYKRES KOŁOWY
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [], datasets: [{ data: [], backgroundColor: ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0'] }]
  };
  public pieChartOptions: ChartOptions<'pie'> = { responsive: true, maintainAspectRatio: false };

  // WYKRES LINIOWY
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [], 
    datasets: [{
      data: [], label: 'Dzienne zużycie (ml)', borderColor: '#198754', backgroundColor: 'rgba(25, 135, 84, 0.2)', fill: true, tension: 0.4
    }]
  };
  public lineChartOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };

  constructor(private devicesService: DevicesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // POBIERAMY RÓWNOCZEŚNIE MASZYNY I HISTORIĘ ZAMÓWIEŃ
    forkJoin({
      devices: this.devicesService.getAllDevices(),
      orders: this.devicesService.getAllOrders()
    }).subscribe({
      next: (data) => {
        this.devices = data.devices;
        this.orders = data.orders;
        this.calculateStats();
      },
      error: (err) => console.error('Błąd pobierania statystyk:', err)
    });
  }

  onDeviceChange(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    if (this.devices.length === 0) return;

    // 1. FILTROWANIE DANYCH
    const filteredDevices = this.selectedDeviceId === 'ALL' 
      ? this.devices 
      : this.devices.filter(d => d.id === this.selectedDeviceId);
      
    // Twój backend zwraca to jako camelCase (deviceId) co widać w kodzie orders.service.ts
    const filteredOrders = this.selectedDeviceId === 'ALL'
      ? this.orders
      : this.orders.filter(o => o.deviceId === this.selectedDeviceId);

    // 2. LOGIKA BAR / PIE CHART
    const usageMap = new Map<string, number>();
    let totalMl = 0;

    filteredDevices.forEach(device => {
      device.slots.forEach(slot => {
        const usedMl = slot.capacity_ml - slot.current_ml;
        if (usedMl > 0) {
          const name = slot.cologne.cologne_name;
          usageMap.set(name, (usageMap.get(name) || 0) + usedMl);
          totalMl += usedMl;
        }
      });
    });

    const labels = Array.from(usageMap.keys());
    const data = Array.from(usageMap.values());

    this.barChartData = {
      labels: labels, datasets: [{ data: data, label: 'Wydane ml', backgroundColor: '#0d6efd', borderRadius: 6 }]
    };
    this.pieChartData = {
      labels: labels, datasets: [{ data: data, backgroundColor: ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0'] }]
    };

    // 🔴 3. PRAWDZIWA LOGIKA WYKRESU LINIOWEGO DOSTOSOWANA DO TWOICH ZMIENNYCH
    const last7DaysLabels: string[] = [];
    const dailyData: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7DaysLabels.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }));
    }

    filteredOrders.forEach(order => {
      // Tylko opłacone zamówienia liczą się do wykresu
      if (order.status !== 'PAID') return;

      // Zmienna creationDate pochodzi prosto z Twojego OrdersService
      const dateString = order.creationDate; 
      const qty = order.quantity || 1; 
      
      if (dateString) {
        const orderDate = new Date(dateString).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
        const index = last7DaysLabels.indexOf(orderDate);
        
        if (index !== -1) {
          dailyData[index] += qty;
        }
      }
    });

    this.lineChartData = {
      labels: last7DaysLabels,
      datasets: [{ ...this.lineChartData.datasets[0], data: dailyData }]
    };

    // 4. KAFELKI PODSUMOWUJĄCE (korzystają z historii zamówień dla kasy)
    let sumRevenue = 0;
    filteredOrders.forEach(order => {
       if(order.status === 'PAID') {
          sumRevenue += Number(order.amount) || 0;
       }
    });

    this.totalDispenses = totalMl;
    this.totalRevenue = sumRevenue; 

    if (labels.length > 0) {
      let bestName = labels[0];
      let maxVal = data[0];
      for (let i = 1; i < labels.length; i++) {
        if (data[i] > maxVal) { maxVal = data[i]; bestName = labels[i]; }
      }
      this.bestseller = bestName;
    } else {
      this.bestseller = 'Brak sprzedaży';
    }

    this.cdr.detectChanges();
  }
}