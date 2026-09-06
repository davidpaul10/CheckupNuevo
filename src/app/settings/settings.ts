import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../services/theme';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  protected themeService = inject(ThemeService);
  protected authService = inject(AuthService);

  notificationsEnabled = signal(true);
  biometricsEnabled = signal(true);
  privacyScreenEnabled = signal(true);
  toastMessage = signal<string | null>(null);
  toastTimeout: any = null;

  // PIN Change modal (T023)
  showPinModal = signal(false);
  pinStep = signal<'current' | 'new' | 'confirm'>('current');
  pinDigits = signal<string[]>(['', '', '', '']);
  newPinDigits = signal<string[]>(['', '', '', '']);
  confirmPinDigits = signal<string[]>(['', '', '', '']);
  pinError = signal<string | null>(null);

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
    const modeName = this.themeService.isDarkMode() ? 'Modo Oscuro' : 'Modo Claro';
    this.showToast(`${modeName} activado`);
  }

  toggleNotifications(): void {
    this.notificationsEnabled.update(v => !v);
    const msg = this.notificationsEnabled() ? 'Notificaciones activadas' : 'Notificaciones desactivadas';
    this.showToast(msg);
  }

  toggleBiometrics(): void {
    this.biometricsEnabled.update(v => !v);
    this.authService.setBiometrics(this.biometricsEnabled());
    const msg = this.biometricsEnabled() ? 'Acceso biométrico activado' : 'Acceso biométrico desactivado';
    this.showToast(msg);
  }

  togglePrivacyScreen(): void {
    this.privacyScreenEnabled.update(v => !v);
    this.authService.setPrivacyScreen(this.privacyScreenEnabled());
    const msg = this.privacyScreenEnabled() ? 'Pantalla privada activada' : 'Pantalla privada desactivada';
    this.showToast(msg);
  }

  // PIN modal flow
  openPinModal(): void {
    this.showPinModal.set(true);
    this.pinStep.set('current');
    this.resetAllPins();
  }

  closePinModal(): void {
    this.showPinModal.set(false);
    this.resetAllPins();
    this.pinError.set(null);
  }

  private resetAllPins(): void {
    this.pinDigits.set(['', '', '', '']);
    this.newPinDigits.set(['', '', '', '']);
    this.confirmPinDigits.set(['', '', '', '']);
  }

  private getCurrentDigits(): string[] {
    const step = this.pinStep();
    if (step === 'current') return this.pinDigits();
    if (step === 'new') return this.newPinDigits();
    return this.confirmPinDigits();
  }

  private setCurrentDigits(digits: string[]): void {
    const step = this.pinStep();
    if (step === 'current') this.pinDigits.set(digits);
    else if (step === 'new') this.newPinDigits.set(digits);
    else this.confirmPinDigits.set(digits);
  }

  enterPinDigit(digit: string): void {
    const digits = [...this.getCurrentDigits()];
    const index = digits.findIndex(d => d === '');
    if (index !== -1) {
      digits[index] = digit;
      this.setCurrentDigits(digits);
      if (index === 3) {
        setTimeout(() => this.advancePinStep(digits.join('')), 200);
      }
    }
  }

  deletePinDigit(): void {
    const digits = [...this.getCurrentDigits()];
    for (let i = 3; i >= 0; i--) {
      if (digits[i] !== '') { digits[i] = ''; break; }
    }
    this.setCurrentDigits(digits);
    this.pinError.set(null);
  }

  clearPinDigits(): void {
    this.setCurrentDigits(['', '', '', '']);
    this.pinError.set(null);
  }

  private advancePinStep(entered: string): void {
    const step = this.pinStep();
    if (step === 'current') {
      // Validate current PIN (demo: 1234)
      if (entered !== '1234') {
        this.pinError.set('PIN actual incorrecto.');
        this.pinDigits.set(['', '', '', '']);
      } else {
        this.pinError.set(null);
        this.pinStep.set('new');
      }
    } else if (step === 'new') {
      if (entered.length < 4) {
        this.pinError.set('Ingresa exactamente 4 dígitos.');
        this.newPinDigits.set(['', '', '', '']);
      } else {
        this.pinError.set(null);
        this.pinStep.set('confirm');
      }
    } else if (step === 'confirm') {
      const newPin = this.newPinDigits().join('');
      const currentPin = this.pinDigits().join('');
      if (entered !== newPin) {
        this.pinError.set('Los PINs no coinciden. Intenta de nuevo.');
        this.confirmPinDigits.set(['', '', '', '']);
      } else {
        // Update in PostgreSQL
        this.authService.updatePin(currentPin, newPin).then((success) => {
          this.closePinModal();
          if (success) {
            this.showToast('✅ PIN actualizado en base de datos');
          } else {
            this.showToast('⚠️ PIN guardado localmente');
          }
        });
      }
    }
  }

  get pinStepLabel(): string {
    const step = this.pinStep();
    if (step === 'current') return 'Ingresa tu PIN actual';
    if (step === 'new') return 'Ingresa tu nuevo PIN';
    return 'Confirma tu nuevo PIN';
  }

  get activePinDigits(): string[] {
    const step = this.pinStep();
    if (step === 'current') return this.pinDigits();
    if (step === 'new') return this.newPinDigits();
    return this.confirmPinDigits();
  }

  onLogout(): void {
    this.authService.logout();
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
