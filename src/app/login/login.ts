import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  protected themeService = inject(ThemeService);

  // Mode: login vs registration
  isRegistering = signal<boolean>(false);

  // Login mode states
  loginMode = signal<'pin' | 'biometric' | 'credentials'>('pin');
  activeAuthModal = signal<'pin' | 'biometric' | 'credentials' | null>(null);
  pinDigits = signal<string[]>(['', '', '', '']);
  currentPinIndex = signal<number>(0);

  email = signal('carlos.rodriguez@checkup.ec');
  password = signal('••••••••');
  rememberMe = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Registration Form States (Personal & Medical Profile)
  regFullName = signal<string>('');
  regEmail = signal<string>('');
  regPassword = signal<string>('');
  regCedula = signal<string>('');
  regAge = signal<number | null>(null);
  regDob = signal<string>('');
  regGender = signal<string>('Masculino');
  regBloodType = signal<string>('O Rh Positive (O+)');
  regWeightKg = signal<number | null>(null);
  regHeightCm = signal<number | null>(null);
  regEmergencyName = signal<string>('');
  regEmergencyPhone = signal<string>('');
  regEmergencyRelation = signal<string>('Familiar');
  regPinDigits = signal<string[]>(['', '', '', '']);
  regBiometrics = signal<boolean>(false);
  regSuccessMessage = signal<string | null>(null);

  // Blood types options
  bloodTypes: string[] = [
    'O Rh Positive (O+)',
    'O Rh Negative (O-)',
    'A Rh Positive (A+)',
    'A Rh Negative (A-)',
    'B Rh Positive (B+)',
    'B Rh Negative (B-)',
    'AB Rh Positive (AB+)',
    'AB Rh Negative (AB-)'
  ];

  genderOptions: string[] = ['Masculino', 'Femenino', 'Otro / Prefiero no decir'];

  get pinString(): string {
    return this.pinDigits().join('');
  }

  get regPinString(): string {
    return this.regPinDigits().join('');
  }

  toggleRegisterMode(): void {
    this.isRegistering.set(!this.isRegistering());
    this.activeAuthModal.set(null);
    this.errorMessage.set(null);
    this.regSuccessMessage.set(null);
  }

  openAuthModal(mode: 'pin' | 'biometric' | 'credentials'): void {
    this.loginMode.set(mode);
    this.activeAuthModal.set(mode);
    this.errorMessage.set(null);
    if (mode === 'pin') {
      this.clearPin();
    }
  }

  closeAuthModal(): void {
    this.activeAuthModal.set(null);
    this.errorMessage.set(null);
    this.clearPin();
  }

  setLoginMode(mode: 'pin' | 'biometric' | 'credentials'): void {
    this.loginMode.set(mode);
    this.activeAuthModal.set(mode);
    this.errorMessage.set(null);
  }

  // --- PIN Keypad for Login ---
  enterPinDigit(digit: string): void {
    const digits = [...this.pinDigits()];
    const index = digits.findIndex(d => d === '');
    if (index !== -1) {
      digits[index] = digit;
      this.pinDigits.set(digits);
      if (index === 3) {
        this.verifyPin(digits.join(''));
      }
    }
  }

  deletePinDigit(): void {
    const digits = [...this.pinDigits()];
    for (let i = 3; i >= 0; i--) {
      if (digits[i] !== '') {
        digits[i] = '';
        this.pinDigits.set(digits);
        break;
      }
    }
    this.errorMessage.set(null);
  }

  clearPin(): void {
    this.pinDigits.set(['', '', '', '']);
    this.errorMessage.set(null);
  }

  verifyPin(pin: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      this.isLoading.set(false);
      const success = this.authService.loginWithPin(pin);
      if (!success) {
        this.errorMessage.set('PIN incorrecto. Ingresa 1234 para demo o tu PIN registrado.');
        this.clearPin();
      }
    }, 400);
  }

  // --- PIN Keypad for Registration ---
  enterRegPinDigit(digit: string): void {
    const digits = [...this.regPinDigits()];
    const index = digits.findIndex(d => d === '');
    if (index !== -1) {
      digits[index] = digit;
      this.regPinDigits.set(digits);
    }
  }

  deleteRegPinDigit(): void {
    const digits = [...this.regPinDigits()];
    for (let i = 3; i >= 0; i--) {
      if (digits[i] !== '') {
        digits[i] = '';
        this.regPinDigits.set(digits);
        break;
      }
    }
    this.errorMessage.set(null);
  }

  clearRegPin(): void {
    this.regPinDigits.set(['', '', '', '']);
  }

  async loginWithBiometrics(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.loginWithBiometrics();
    } catch (err: any) {
      this.errorMessage.set('Autenticación biométrica no completada.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onLogin(event?: Event): void {
    if (event) event.preventDefault();
    this.onSubmitCredentials();
  }

  onSubmitCredentials(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    setTimeout(async () => {
      const res = await this.authService.login(this.email().trim(), this.password().trim());
      this.isLoading.set(false);
      if (!res.success) {
        this.errorMessage.set(res.message || 'Correo o contraseña incorrectos.');
      }
    }, 300);
  }

  // --- Complete Registration Flow ---
  async onRegister(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);
    this.regSuccessMessage.set(null);

    const name = this.regFullName().trim();
    const email = this.regEmail().trim();
    const pass = this.regPassword().trim();
    const pin = this.regPinString;

    if (!name) {
      this.errorMessage.set('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!email || !email.includes('@')) {
      this.errorMessage.set('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!pass || pass.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (pin.length !== 4) {
      this.errorMessage.set('Debes configurar un código PIN de exactamente 4 dígitos.');
      return;
    }

    this.isLoading.set(true);
    try {
      const res = await this.authService.register({
        fullName: name,
        email: email,
        password: pass,
        pin: pin,
        biometricsEnabled: this.regBiometrics(),
        cedula: this.regCedula().trim() || undefined,
        age: this.regAge() ? Number(this.regAge()) : undefined,
        dob: this.regDob().trim() || undefined,
        gender: this.regGender(),
        bloodType: this.regBloodType(),
        weightKg: this.regWeightKg() ? Number(this.regWeightKg()) : undefined,
        heightCm: this.regHeightCm() ? Number(this.regHeightCm()) : undefined,
        emergencyName: this.regEmergencyName().trim() || undefined,
        emergencyPhone: this.regEmergencyPhone().trim() || undefined,
        emergencyRelation: this.regEmergencyRelation()
      });

      if (res.success) {
        this.regSuccessMessage.set('¡Cuenta y ficha médica creada con éxito! Ingresando...');
      } else {
        this.errorMessage.set(res.message || 'Error al registrar la cuenta.');
      }
    } catch (e: any) {
      this.errorMessage.set('No se pudo conectar con el servidor.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
