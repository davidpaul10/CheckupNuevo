import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserProfile } from '../models/checkup.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  isLoggedIn = signal<boolean>(false);
  privacyBlurActive = signal<boolean>(false);
  privacyScreenEnabled = signal<boolean>(true);
  biometricsAvailable = signal<boolean>(true);
  
  currentUser = signal<UserProfile>({
    id: 'USR-2026-8849',
    fullName: 'Carlos M. Rodríguez',
    email: 'carlos.rodriguez@checkup.ec',
    phone: '+593 99 234 5678',
    city: 'Quito',
    pinHash: '1234',
    biometricsEnabled: true,
    privacyBlurEnabled: true,
    notificationPreferences: {
      email: true,
      sms: false,
      whatsapp: true
    },
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-08-20T15:30:00Z'
  });

  private sessionTimeoutHandle: any = null;
  private readonly SESSION_TIMEOUT_MS = 15 * 60 * 1000;

  constructor() {
    this.initFromStorage();
    this.setupPrivacyBlurListener();
    this.resetSessionTimer();
  }

  private initFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedAuth = localStorage.getItem('checkup_auth');
      const savedToken = localStorage.getItem('checkup_token');
      const savedPrivacy = localStorage.getItem('checkup_privacy_screen');

      // Restore privacy screen preference (default: true)
      if (savedPrivacy !== null) {
        this.privacyScreenEnabled.set(savedPrivacy === 'true');
      }

      if (savedAuth === 'true' && savedToken) {
        this.isLoggedIn.set(true);
        this.fetchProfile();
      }
    }
  }

  fetchProfile(): void {
    this.http.get<{ success: boolean; user: UserProfile }>(`${this.apiUrl}/me`).subscribe({
      next: (res) => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          this.privacyScreenEnabled.set(res.user.privacyBlurEnabled);
          this.biometricsAvailable.set(res.user.biometricsEnabled);
        }
      },
      error: () => {
        // Fallback gracefully
      }
    });
  }

  private setupPrivacyBlurListener(): void {
    if (typeof document !== 'undefined') {
      // Activate the privacy shield when the tab becomes hidden (user switches app/tab)
      document.addEventListener('visibilitychange', () => {
        if (this.privacyScreenEnabled() && this.isLoggedIn()) {
          if (document.hidden) {
            this.privacyBlurActive.set(true);
          }
          // Do NOT auto-dismiss when tab becomes visible again.
          // User must explicitly click the shield to dismiss it.
        }
      });
      // Intentionally NOT listening to window 'focus' / 'blur' events
      // to avoid auto-dismissing the shield before the user sees it.
    }
  }

  loginWithPin(enteredPin: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; sessionToken: string; user: UserProfile }>(`${this.apiUrl}/unlock`, {
        authMethod: 'PIN',
        pin: enteredPin,
        email: this.currentUser()?.email || undefined
      }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            this.setSession(res.sessionToken, res.user);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: () => {
          resolve(false);
        }
      });
    });
  }

  loginWithBiometrics(): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; sessionToken: string; user: UserProfile }>(`${this.apiUrl}/unlock`, {
        authMethod: 'BIOMETRIC',
        email: this.currentUser()?.email || undefined
      }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            this.setSession(res.sessionToken, res.user);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: () => {
          resolve(false);
        }
      });
    });
  }

  login(email: string, password?: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; sessionToken: string; user: UserProfile; message?: string }>(`${this.apiUrl}/login`, {
        email,
        password
      }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            this.setSession(res.sessionToken, res.user);
            resolve({ success: true });
          } else {
            resolve({ success: false, message: res.message || 'Credenciales inválidas' });
          }
        },
        error: (err) => {
          const msg = err.error?.message || 'Correo o contraseña incorrectos.';
          resolve({ success: false, message: msg });
        }
      });
    });
  }

  register(data: {
    fullName: string;
    email: string;
    password: string;
    pin: string;
    biometricsEnabled?: boolean;
    cedula?: string;
    age?: number;
    dob?: string;
    gender?: string;
    bloodType?: string;
    weightKg?: number;
    heightCm?: number;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; message?: string; sessionToken: string; user: UserProfile }>(`${this.apiUrl}/register`, data).subscribe({
        next: (res) => {
          if (res.success) {
            this.setSession(res.sessionToken, res.user);
            resolve({ success: true, message: res.message });
          } else {
            resolve({ success: false, message: res.message || 'Error al crear cuenta' });
          }
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al conectar con el servidor';
          resolve({ success: false, message: msg });
        }
      });
    });
  }

  private setSession(token: string, user: UserProfile): void {
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('checkup_auth', 'true');
      localStorage.setItem('checkup_token', token);
    }
    this.resetSessionTimer();
    this.router.navigate(['/home']);
  }

  updatePin(currentPin: string, newPin: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; user: UserProfile }>(`${this.apiUrl}/pin/update`, {
        currentPin,
        newPin
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.currentUser.set(res.user);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: () => {
          this.currentUser.update(u => ({ ...u, pinHash: newPin }));
          resolve(true);
        }
      });
    });
  }

  setPrivacyScreen(enabled: boolean): void {
    this.privacyScreenEnabled.set(enabled);
    this.currentUser.update(u => ({ ...u, privacyBlurEnabled: enabled }));
    // Persist in localStorage so the preference survives page refresh
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('checkup_privacy_screen', String(enabled));
    }
    // If disabling, also hide any active shield immediately
    if (!enabled) {
      this.privacyBlurActive.set(false);
    }
    this.http.patch(`${this.apiUrl}/preferences`, { privacyBlurEnabled: enabled }).subscribe();
  }

  setBiometrics(enabled: boolean): void {
    this.biometricsAvailable.set(enabled);
    this.currentUser.update(u => ({ ...u, biometricsEnabled: enabled }));
    this.http.patch(`${this.apiUrl}/preferences`, { biometricsEnabled: enabled }).subscribe();
  }

  resetSessionTimer(): void {
    if (this.sessionTimeoutHandle) {
      clearTimeout(this.sessionTimeoutHandle);
    }
    if (typeof window !== 'undefined') {
      this.sessionTimeoutHandle = setTimeout(() => {
        if (this.isLoggedIn()) {
          this.lockScreen();
        }
      }, this.SESSION_TIMEOUT_MS);
    }
  }

  lockScreen(): void {
    this.isLoggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('checkup_auth', 'false');
    }
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.isLoggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('checkup_auth');
      localStorage.removeItem('checkup_token');
    }
    this.router.navigate(['/login']);
  }
}
