import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Home } from './home/home';
import { Appointments } from './appointments/appointments';
import { Results } from './results/results';
import { GreenPass } from './green-pass/green-pass';
import { Profile } from './profile/profile';
import { Settings } from './settings/settings';
import { Login } from './login/login';
import { AuthService } from './services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'appointments', component: Appointments, canActivate: [authGuard] },
  { path: 'results', component: Results, canActivate: [authGuard] },
  { path: 'resultados', redirectTo: 'results', pathMatch: 'full' },
  { path: 'green-pass', component: GreenPass, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: 'configuracion', redirectTo: 'settings', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
