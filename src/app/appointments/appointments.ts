import { Component, ElementRef, Renderer2, ViewChild, AfterViewInit, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as QRCode from 'qrcode';
import { AppointmentService } from '../services/appointment.service';
import { ResultsService } from '../services/results.service';
import { Appointment, AppointmentStatus } from '../models/checkup.types';

export interface DisplayAppointment {
  id: string;
  labName: string;
  sede: string;
  city: string;
  dateLabel: string;
  timeLabel: string;
  reason: string;
  instructions: string;
  status: AppointmentStatus;
  statusLabel: string;
  statusClass: string;
  mapRank: number;
  rating: number;
  distance: string;
  doctor?: string;
  preference?: string;
  checkInQrCode: string;
  qrDataUrl?: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css'
})
export class Appointments implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalsRoot') modalsRoot!: ElementRef<HTMLDivElement>;

  private appointmentService = inject(AppointmentService);
  private resultsService = inject(ResultsService);
  private router = inject(Router);
  private renderer = inject(Renderer2);

  showNotificationBadge = true;
  showNotificationTooltip = true;

  // Selected appointment for detail modal
  selectedAppointment = signal<DisplayAppointment | null>(null);
  selectedQrDataUrl = signal<string>('');
  isCompleting = signal<boolean>(false);
  completionSuccess = signal<string | null>(null);

  // Animated completion modal
  showCompletingModal = signal<boolean>(false);
  completingStep = signal<number>(0); // 0=processing, 1=done

  // Modals
  showDetailModal = signal<boolean>(false);
  showManageModal = signal<boolean>(false);
  showBookingModal = signal<boolean>(false);

  // Fallback demo appointments if DB is initially empty
  private defaultAppointments: DisplayAppointment[] = [
    {
      id: 'APPT-2026-9481',
      labName: 'Laboratorio Zurita & Zurita',
      sede: 'Centro Norte',
      city: 'Quito',
      dateLabel: 'Hoy',
      timeLabel: '10:30 AM',
      reason: 'Chequeo Preventivo Completo',
      instructions: 'Presentarse en ayunas de 8 horas. Muestra este código QR en el lector express de recepción para saltarte el papeleo manual.',
      status: 'CONFIRMED',
      statusLabel: 'Pendiente',
      statusClass: 'status-pending',
      mapRank: 1,
      rating: 4.8,
      distance: '1.2 km',
      doctor: 'Carlos Mendoza',
      preference: 'Prioritario',
      checkInQrCode: 'checkup:appt:APPT-2026-9481:a94b8e21'
    },
    {
      id: 'APPT-2026-3392',
      labName: 'Clínica de la Mujer',
      sede: 'Sede Eloy Alfaro',
      city: 'Quito',
      dateLabel: 'Mañana',
      timeLabel: '09:00 AM',
      reason: 'Perfil Lipídico & Glucosa',
      instructions: 'Llegar 10 minutos antes con documento de identidad original.',
      status: 'CHECKED_IN',
      statusLabel: 'Agendado',
      statusClass: 'status-checkedin',
      mapRank: 2,
      rating: 4.6,
      distance: '2.5 km',
      doctor: 'Valeria Ruales',
      preference: 'General',
      checkInQrCode: 'checkup:appt:APPT-2026-3392:b83c9d12'
    },
    {
      id: 'APPT-2026-1104',
      labName: 'Laboratorio San José',
      sede: 'Sucursal Central',
      city: 'Quito',
      dateLabel: '15 Jul 2026',
      timeLabel: '08:00 AM',
      reason: 'Panel Salud Sexual Completo',
      instructions: 'Examen completado exitosamente. Resultados disponibles en el módulo de Resultados.',
      status: 'COMPLETED',
      statusLabel: 'Terminado',
      statusClass: 'status-completed',
      mapRank: 3,
      rating: 4.9,
      distance: '3.1 km',
      doctor: 'Andrés Benítez',
      preference: 'Preferencial',
      checkInQrCode: 'checkup:appt:APPT-2026-1104:c72a1e34'
    }
  ];

  // Reactively compute appointments list from AppointmentService signal
  appointmentList = computed<DisplayAppointment[]>(() => {
    const raw = this.appointmentService.appointments();
    if (!raw || raw.length === 0) {
      return this.defaultAppointments;
    }

    return raw.map((a, idx) => {
      let statusLabel = 'Pendiente';
      let statusClass = 'status-pending';

      if (a.status === 'COMPLETED') {
        statusLabel = 'Terminado';
        statusClass = 'status-completed';
      } else if (a.status === 'CHECKED_IN') {
        statusLabel = 'Agendado';
        statusClass = 'status-checkedin';
      } else if (a.status === 'CANCELLED') {
        statusLabel = 'Cancelado';
        statusClass = 'status-cancelled';
      } else {
        statusLabel = 'Pendiente';
        statusClass = 'status-pending';
      }

      return {
        id: a.id,
        labName: a.laboratoryName || 'Laboratorio Aliado',
        sede: 'Sede Principal',
        city: 'Quito',
        dateLabel: a.appointmentDate || 'Hoy',
        timeLabel: a.appointmentTime || '08:30 AM',
        reason: a.examTitle || 'Examen Clínico',
        instructions: a.status === 'COMPLETED'
          ? 'Cita finalizada. Muestra tu documento en recepción si requieres copia física.'
          : 'Presentarse en ayunas de 8 horas. Muestra este código QR en el lector express de recepción.',
        status: a.status,
        statusLabel,
        statusClass,
        mapRank: (idx % 3) + 1,
        rating: 4.8,
        distance: `${1.2 + (idx * 0.8)} km`,
        doctor: idx % 2 === 0 ? 'Carlos Mendoza' : 'Valeria Ruales',
        preference: 'Prioritario',
        checkInQrCode: a.checkInQrCode || `checkup:appt:${a.id}:exp`
      };
    });
  });

  // Agendamiento Express state
  examTypes = ['Examen de Rutina', 'Perfil Lipídico', 'Hemograma Completo', 'Prueba de Glucosa', 'Panel ETS Completo'];
  doctorList = ['Carlos Mendoza', 'Valeria Ruales', 'Andrés Benítez', 'Sofía Salazar'];
  preferenceOptions = ['Prioritario', 'Trato Preferencial', 'General'];
  availabilityOptions = ['Hoy', 'Mañana', 'En 3 días'];
  timeSlots = ['08:00 AM', '09:30 AM', '10:30 AM', '11:45 AM', '02:00 PM', '04:30 PM'];

  selectedExamType = this.examTypes[0];
  selectedDoctor = this.doctorList[0];
  selectedPreference = this.preferenceOptions[0];
  selectedAvailability = this.availabilityOptions[0];
  selectedTimeSlot = this.timeSlots[0];

  ngOnInit(): void {
    this.appointmentService.fetchAppointments();
  }

  ngAfterViewInit(): void {
    if (this.modalsRoot?.nativeElement) {
      this.renderer.appendChild(document.body, this.modalsRoot.nativeElement);
    }

    setTimeout(() => {
      this.showNotificationTooltip = false;
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.modalsRoot?.nativeElement?.parentNode) {
      this.modalsRoot.nativeElement.parentNode.removeChild(this.modalsRoot.nativeElement);
    }
  }

  toggleNotifications(): void {
    this.showNotificationTooltip = !this.showNotificationTooltip;
    this.showNotificationBadge = false;
  }

  // --- Open Detailed Appointment Modal ---
  async openAppointmentDetail(appt: DisplayAppointment): Promise<void> {
    this.selectedAppointment.set(appt);
    this.completionSuccess.set(null);
    
    // Generate real QR code image URL
    try {
      const qrPayload = appt.checkInQrCode || `checkup:appt:${appt.id}`;
      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      this.selectedQrDataUrl.set(url);
    } catch (err) {
      console.error('Error al generar QR:', err);
    }

    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.completionSuccess.set(null);
  }

  // --- Mark Appointment as Completed (Generates Results in DB) ---
  async markAsCompleted(): Promise<void> {
    const selected = this.selectedAppointment();
    if (!selected) return;

    // Close detail modal and show animated processing modal
    this.showDetailModal.set(false);
    this.completingStep.set(0);
    this.showCompletingModal.set(true);
    this.isCompleting.set(true);

    try {
      await this.appointmentService.completeAppointment(selected.id);

      // Update local appointment state
      const updated: DisplayAppointment = {
        ...selected,
        status: 'COMPLETED',
        statusLabel: 'Terminado',
        statusClass: 'status-completed',
        instructions: 'Cita completada. Resultado clínico generado y guardado en tu historial médico.'
      };
      this.selectedAppointment.set(updated);

      // Step 1 → show success state for 1.5s then navigate
      this.completingStep.set(1);

      await new Promise<void>(resolve => setTimeout(resolve, 2000));

      // Refresh results service so new result appears
      this.resultsService.fetchResults();

      // Navigate to results
      this.showCompletingModal.set(false);
      this.router.navigate(['/results']);
    } catch (e) {
      console.error('Error al completar cita:', e);
      this.showCompletingModal.set(false);
    } finally {
      this.isCompleting.set(false);
    }
  }

  goToResults(): void {
    this.closeDetailModal();
    this.router.navigate(['/results']);
  }

  // --- Save QR to Gallery (Real PNG Download) ---
  saveToGallery(): void {
    const qrUrl = this.selectedQrDataUrl();
    const appt = this.selectedAppointment();
    if (!qrUrl) return;

    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_Cita_${appt?.id || 'CheckUp'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('✅ Imagen del Código QR guardada en tus descargas / galería.');
  }

  // --- Share Appointment & QR via WhatsApp ---
  shareViaWhatsApp(): void {
    const appt = this.selectedAppointment();
    if (!appt) return;

    const text = `🏥 *CITA MÉDICA - CHECKUP+*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📍 *Lugar:* ${appt.labName} (${appt.sede})\n` +
      `📅 *Fecha:* ${appt.dateLabel}\n` +
      `⏰ *Hora:* ${appt.timeLabel}\n` +
      `🔬 *Examen:* ${appt.reason}\n` +
      `👨‍⚕️ *Especialista:* Dr(a). ${appt.doctor || 'Asignado'}\n` +
      `📋 *Estado:* ${appt.statusLabel.toUpperCase()}\n` +
      `🔑 *Código QR Check-In:* ${appt.checkInQrCode}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Instrucciones:* ${appt.instructions}\n` +
      `✅ Muestra tu código QR en recepción para ingreso prioritario.`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  // --- Maps Route ---
  openMapRoute(): void {
    const appt = this.selectedAppointment();
    if (!appt) return;
    const query = encodeURIComponent(`${appt.labName} ${appt.sede} ${appt.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  // --- Express Booking Modal ---
  openBookingModal(): void {
    this.showBookingModal.set(true);
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
  }

  selectExamType(exam: string): void {
    this.selectedExamType = exam;
  }

  selectDoctor(doc: string): void {
    this.selectedDoctor = doc;
  }

  selectPreference(pref: string): void {
    this.selectedPreference = pref;
  }

  selectAvailability(option: string): void {
    this.selectedAvailability = option;
  }

  selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
  }

  async confirmBooking(): Promise<void> {
    const targetLabId = 'lab-zurita-centronorte';
    const targetExamId = this.selectedExamType.includes('Lipídico') ? 'exam-ets-completo' : 'exam-rutina-completa';

    try {
      const newAppt = await this.appointmentService.bookAppointment(
        targetLabId,
        targetExamId,
        this.selectedAvailability,
        this.selectedTimeSlot,
        35.00,
        this.selectedExamType
      );

      this.closeBookingModal();

      // Automatically open the newly created appointment detail
      const displayAppt: DisplayAppointment = {
        id: newAppt.id,
        labName: newAppt.laboratoryName || 'Laboratorio Zurita & Zurita',
        sede: 'Centro Norte',
        city: 'Quito',
        dateLabel: newAppt.appointmentDate,
        timeLabel: newAppt.appointmentTime,
        reason: newAppt.examTitle,
        instructions: 'Presentarse en ayunas de 8 horas. Muestra este código QR en el lector express de recepción para saltarte el papeleo manual.',
        status: newAppt.status,
        statusLabel: 'Pendiente',
        statusClass: 'status-pending',
        mapRank: 1,
        rating: 4.9,
        distance: '1.2 km',
        doctor: this.selectedDoctor,
        preference: this.selectedPreference,
        checkInQrCode: newAppt.checkInQrCode
      };

      await this.openAppointmentDetail(displayAppt);
    } catch (e) {
      console.error('Error al agendar cita:', e);
      this.closeBookingModal();
    }
  }

  // --- Manage Modal ---
  openManageModal(): void {
    this.showManageModal.set(true);
  }

  closeManageModal(): void {
    this.showManageModal.set(false);
  }

  saveReschedule(): void {
    this.closeManageModal();
    alert('✅ Cita reagendada exitosamente.');
  }

  cancelAppointment(): void {
    this.closeManageModal();
    alert('❌ Cita cancelada.');
  }
}