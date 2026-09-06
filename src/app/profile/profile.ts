import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

export interface MedicalCertificate {
  id: string;
  title: string;
  laboratory: string;
  date: string;
  status: 'AL DÍA' | 'NORMAL' | 'PENDIENTE';
  fileSize: string;
  doctor: string;
  code: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private authService = inject(AuthService);

  // User profile data dynamically linked to authenticated session
  userName = computed(() => this.authService.currentUser()?.fullName || 'Usuario CheckUp+');
  userId = computed(() => this.authService.currentUser()?.id || 'PV-PENDING');
  bloodType = computed(() => this.authService.currentUser()?.bloodType || 'No registrado');
  userAvatar = signal('https://i.pravatar.cc/150?img=33');

  // Confidentiality setting
  isConfidential = signal(false);

  // Emergency contact data & edit state (editable)
  emergencyPhone = signal<string>(this.authService.currentUser()?.emergencyContact?.phone || '+593 99 123 4567');
  emergencyName = signal<string>(this.authService.currentUser()?.emergencyContact?.name || 'Contacto de Emergencia');
  isEditingContact = signal(false);
  tempPhone = signal('');
  tempName = signal('');

  // Toast notification
  toastMessage = signal<string | null>(null);
  toastTimeout: any = null;

  // Selected document for modal preview
  selectedDoc = signal<MedicalCertificate | null>(null);

  // Certificates list matching prototype
  certificates = signal<MedicalCertificate[]>([
    {
      id: 'doc-1',
      title: 'Examen de Sangre Completo',
      laboratory: 'Laboratorio San José',
      date: '12 Jul 2026',
      status: 'AL DÍA',
      fileSize: '1.2 MB',
      doctor: 'Dr. Fernando Salazar',
      code: 'CERT-2026-8841'
    },
    {
      id: 'doc-2',
      title: 'Perfil Lipídico & Glucosa',
      laboratory: 'Laboratorios Integrales',
      date: '04 May 2026',
      status: 'NORMAL',
      fileSize: '950 KB',
      doctor: 'Dra. Elena Morales',
      code: 'CERT-2026-5512'
    },
    {
      id: 'doc-3',
      title: 'Prueba Serológica Confidencial',
      laboratory: 'Clínica de la Mujer',
      date: '18 Ene 2026',
      status: 'AL DÍA',
      fileSize: '820 KB',
      doctor: 'Dr. Roberto Mendoza',
      code: 'CERT-2026-1092'
    }
  ]);

  toggleConfidentiality(): void {
    this.isConfidential.update(val => !val);
    const msg = this.isConfidential()
      ? 'Modo de confidencialidad activado'
      : 'Modo de confidencialidad desactivado';
    this.showToast(msg);
  }

  openEditContact(): void {
    this.tempPhone.set(this.emergencyPhone());
    this.tempName.set(this.emergencyName());
    this.isEditingContact.set(true);
  }

  closeEditContact(): void {
    this.isEditingContact.set(false);
  }

  saveEmergencyContact(): void {
    if (this.tempPhone().trim()) {
      this.emergencyPhone.set(this.tempPhone().trim());
      if (this.tempName().trim()) {
        this.emergencyName.set(this.tempName().trim());
      }
      this.showToast('Contacto de emergencia actualizado');
    }
    this.isEditingContact.set(false);
  }

  downloadDoc(event: Event, doc: MedicalCertificate): void {
    event.stopPropagation();
    this.showToast(`Descargando ${doc.title}.pdf...`);
  }

  viewDocDetails(doc: MedicalCertificate): void {
    this.selectedDoc.set(doc);
  }

  closeDocModal(): void {
    this.selectedDoc.set(null);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
