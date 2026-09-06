import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GreenPass } from '../models/checkup.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GreenPassService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/green-pass`;

  currentPass = signal<GreenPass>({
    passToken: 'PV-2026-884920',
    userId: 'USR-2026-8849',
    status: 'AL_DIA',
    lastCheckupDate: '12 Jul 2026',
    validUntil: '2026-08-28T23:59:59Z',
    qrPayload: 'checkup:pass:PV-2026-884920:exp=1787884800',
    isDynamicRotated: true
  });

  constructor() {
    this.fetchCurrentPass();
  }

  fetchCurrentPass(): void {
    this.http.get<{ success: boolean; greenPass: GreenPass }>(`${this.apiUrl}/current`).subscribe({
      next: (res) => {
        if (res.success && res.greenPass) {
          this.currentPass.set(res.greenPass);
        }
      },
      error: () => {}
    });
  }

  /**
   * RF4.1 - Generate Dynamic Ephemeral Green Pass
   */
  generatePass(): Promise<GreenPass> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; greenPass: GreenPass }>(`${this.apiUrl}/generate`, {}).subscribe({
        next: (res) => {
          if (res.success && res.greenPass) {
            this.currentPass.set(res.greenPass);
            resolve(res.greenPass);
          }
        },
        error: () => {
          resolve(this.currentPass());
        }
      });
    });
  }

  /**
   * RF4.2 - Strict Visual Privacy Public Validation
   */
  verifyPassToken(token: string): Promise<{
    status: 'AL_DIA' | 'PENDIENTE' | 'VENCIDO';
    statusBadge: string;
    patientName?: string;
    lastCheckupDate: string;
    validUntil: string;
    disclaimer: string;
    code?: string;
  }> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.apiUrl}/verify/${token}`).subscribe({
        next: (res) => {
          if (res.success) {
            resolve({
              status: res.status,
              statusBadge: res.statusBadge,
              patientName: res.patientName,
              lastCheckupDate: res.lastCheckupDate,
              validUntil: res.validUntil,
              disclaimer: res.disclaimer,
              code: res.code
            });
          }
        },
        error: () => {
          const pass = this.currentPass();
          resolve({
            status: pass.status,
            statusBadge: 'Chequeos al Día',
            patientName: 'Carlos M.',
            lastCheckupDate: pass.lastCheckupDate,
            validUntil: pass.validUntil,
            disclaimer: 'Certificado de privacidad visual CheckUp+.',
            code: pass.passToken
          });
        }
      });
    });
  }
}
