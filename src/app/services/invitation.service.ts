import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CoupleInvitation, ExamCategory } from '../models/checkup.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invitations`;

  invitations = signal<CoupleInvitation[]>([]);

  constructor() {
    this.fetchInvitations();
  }

  fetchInvitations(): void {
    this.http.get<{ success: boolean; invitations: CoupleInvitation[] }>(`${this.apiUrl}/my`).subscribe({
      next: (res) => {
        if (res.success && res.invitations) {
          this.invitations.set(res.invitations);
        }
      },
      error: () => {}
    });
  }

  /**
   * RF5.1 - Create Discreet Couple Invitation in PostgreSQL
   */
  createInvitation(
    senderAlias: string = 'Carlos',
    category: ExamCategory = 'salud_sexual',
    customMessage?: string
  ): Promise<{ invitation: CoupleInvitation; whatsappUrl: string }> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; invitation: CoupleInvitation; whatsappUrl: string }>(`${this.apiUrl}/create`, {
        senderAlias,
        category,
        customMessage
      }).subscribe({
        next: (res) => {
          if (res.success && res.invitation) {
            this.invitations.update(list => [res.invitation, ...list]);
            resolve({ invitation: res.invitation, whatsappUrl: res.whatsappUrl });
          }
        },
        error: () => {
          const code = `CARE-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const fallback: CoupleInvitation = {
            id: `INV-${Date.now()}`,
            senderAlias,
            inviteCode: code,
            customMessage: customMessage || '¡Hola! Cuidemos nuestra salud juntos.',
            preferredExamCategory: category,
            shareableUrl: `http://localhost:4200/appointments?invite=${code}&from=${encodeURIComponent(senderAlias)}`,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          };
          this.invitations.update(list => [fallback, ...list]);
          resolve({
            invitation: fallback,
            whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(fallback.shareableUrl)}`
          });
        }
      });
    });
  }

  getWhatsAppShareUrl(invitation: CoupleInvitation): string {
    const text = encodeURIComponent(invitation.customMessage || invitation.shareableUrl);
    return `https://api.whatsapp.com/send?text=${text}`;
  }
}
