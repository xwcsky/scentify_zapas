import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { DiscountsApiService, DiscountCode, CreateDiscountDto } from '../../services/discounts-api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  codes: DiscountCode[] = [];
  newCode: CreateDiscountDto = {
    code: '',
    percent: 100,
    maxUsages: 1
  };
  isLoading = false;

  constructor(
    private discountsApi: DiscountsApiService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCodes();
  }

  loadCodes(): void {
    this.discountsApi.getAll().subscribe({
      next: (data) => {
        this.codes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Błąd pobierania kodów:', err)
    });
  }

  generateCode(): void {
    if (!this.newCode.code) return;
    this.isLoading = true;

    this.discountsApi.create(this.newCode).subscribe({
      next: () => {
        alert('✅ Kod utworzony!');
        this.loadCodes();
        this.isLoading = false;
        this.newCode = { ...this.newCode, code: '' };
      },
      error: (err) => {
        alert('❌ Błąd: ' + (err.error?.message || err.message));
        this.isLoading = false;
      }
    });
  }

  toggleStatus(code: DiscountCode): void {
    this.discountsApi.toggleStatus(code.id).subscribe({
      next: () => this.loadCodes(),
      error: (err) => alert('Błąd zmiany statusu: ' + err.message)
    });
  }

  deleteCode(code: DiscountCode): void {
    if (!confirm(`Czy na pewno usunąć kod ${code.code}?`)) return;

    this.discountsApi.delete(code.id).subscribe({
      next: () => this.loadCodes(),
      error: (err) => alert('Błąd usuwania: ' + err.message)
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}