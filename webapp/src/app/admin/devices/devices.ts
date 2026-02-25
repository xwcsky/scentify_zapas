import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DevicesService, Device } from '../services/devices';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './devices.html',
  styleUrls: ['./devices.scss']
})
export class DevicesComponent implements OnInit {
  devices: Device[] = [];

  constructor(
    private devicesService: DevicesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Komponent się załadował! Wywołuję loadDevices()...');
    this.loadDevices();
  }

  // Pobiera maszyny z serwera
  loadDevices(): void {
    console.log('📡 Wysłano zapytanie do serwera...');
    this.devicesService.getAllDevices().subscribe({
      next: (data) => {
        console.log('✅ Angular odebrał dane i wpisuje je do zmiennej:', data);
        this.devices = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Błąd podczas pobierania maszyn:', err);
      }
    });
  }

  // Akcja po kliknięciu "Uzupełnij"
  refillSlot(slotId: number): void {
    if (confirm('Czy na pewno chcesz zresetować poziom płynu w tym slocie do 1000ml?')) {
      this.devicesService.refillSlot(slotId).subscribe({
        next: () => {
          alert('✅ Płyn został uzupełniony!');
          this.loadDevices(); // Odświeżamy listę, żeby zobaczyć 1000ml
        },
        error: (err) => {
          console.error('Błąd odnawiania płynu:', err);
          alert('Wystąpił błąd podczas uzupełniania płynu.');
        }
      });
    }
  }

  // Funkcja pomocnicza do paska postępu
  getPercentage(current: number, capacity: number): number {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
  }
}