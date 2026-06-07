import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { ShopComponent } from './shop/views/shop/shop.component';
import { AdminComponent } from './admin/views/admin/admin.component';
import { PayComponent } from './payment/views/pay.component/pay.component';
import { ConfirmComponent } from './payment/views/confirm.component/confirm.component';
import { ErrorComponent } from './payment/views/error.component/error.component';
import { ScreensaverComponent } from './screensaver/screensaver'; 
import { DashboardComponent } from './admin/dashboard/dashboard';
import { CouponsComponent } from './admin/coupons/coupons';
import { DevicesComponent } from './admin/devices/devices';
import { StatisticsComponent } from './admin/statistics/statistics';
import { ServiceLandingComponent } from './service-landing/service-landing';

export const routes: Routes = [
  // --- STREFY PUBLICZNE (Dostępne dla każdego) ---
  
  // Nasz fake sklep
  { path: '', component: ServiceLandingComponent, pathMatch: 'full', data: { breadcrumb: 'Konsultacja Olfaktoryczna' } },
  // 1. Ekran startowy 
  { path: 'shop', component: ShopComponent, data: { breadcrumb: 'Sklep' } },
  
  // 2. Logowanie
  { path: 'login', component: LoginComponent, data: { breadcrumb: 'Logowanie' } },

  // 3. Płatności - TU BYŁ BŁĄD. Musi być 'payment/pay', żeby pasowało do linku z QR kodu
  { path: 'payment/pay', component: PayComponent, data: { breadcrumb: 'Płatność' } },
  { path: 'payment/confirm', component: ConfirmComponent, data: { breadcrumb: 'Potwierdzenie' } },
  { path: 'payment/error', component: ErrorComponent, data: { breadcrumb: 'Błąd płatności' } },
  
  // --- STREFY CHRONIONE (Wymagają logowania) ---
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'shop', component: ShopComponent, data: { breadcrumb: 'Sklep' } },
      { path: 'admin', component: DashboardComponent, data: { breadcrumb: 'Panel admina' } },
      { path: 'admin/kody-rabatowe', component: CouponsComponent, data: { breadcrumb: 'Kody Rabatowe' } },
      { path: 'admin/devices', component: DevicesComponent, data: { breadcrumb: 'Urządzenia' }},
      { path: 'admin/statistics', component: StatisticsComponent, data: { breadcrumb: 'Statystyki' }},
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
    ],
  },

  // --- FALLBACK (Dla błędnych adresów) ---
  // Jeśli adres nie istnieje, idź do wygaszacza (zamiast do sklepu, który by Cię wyrzucił)
  { path: '**', redirectTo: 'screensaver' },
];