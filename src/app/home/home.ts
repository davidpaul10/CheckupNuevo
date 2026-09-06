import { Component, signal, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitationService } from '../services/invitation.service';
import { AppointmentService } from '../services/appointment.service';
import { AuthService } from '../services/auth';

export interface LabPriceItem {
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  icon?: string;
}

export interface Laboratory {
  id: number;
  name: string;
  distance: string;
  address: string;
  specialty: string;
  rating: number;
  image: string;
  phone: string;
  branch: string;
  category: 'rutina' | 'cercanas' | 'todos' | string;
  badge?: string;
  reviewsCount?: number;
  prices: LabPriceItem[];
}

export interface ExamType {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  hasDiscount?: boolean;
  selected: boolean;
}

export interface TimeSlot {
  time: string;
  selected: boolean;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'appointment' | 'promo' | 'info';
}

export interface PromotionItem {
  id: number;
  title: string;
  subtitle: string;
  discountBadge: string;
  labName: string;
  labId: number;
  originalPrice: number;
  promoPrice: number;
  validUntil: string;
  image: string;
  tags: string[];
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private invitationService = inject(InvitationService);
  protected authService = inject(AuthService);

  // Couple Invitation Modal (T030 / US6)
  showInviteModal = signal(false);
  inviteLink = signal<string | null>(null);
  inviteCopied = signal(false);
  inviteWhatsappMessage = signal<string | null>(null);

  async openInviteModal(): Promise<void> {
    const senderName = this.authService.currentUser()?.fullName || 'Usuario CheckUp+';
    const res = await this.invitationService.createInvitation(senderName);
    this.inviteLink.set(res.invitation.shareableUrl);
    this.inviteWhatsappMessage.set(res.whatsappUrl);
    this.inviteCopied.set(false);
    this.showInviteModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
    document.body.style.overflow = '';
  }

  copyInviteLink(): void {
    const link = this.inviteLink();
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        this.inviteCopied.set(true);
        setTimeout(() => this.inviteCopied.set(false), 2500);
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.inviteCopied.set(true);
        setTimeout(() => this.inviteCopied.set(false), 2500);
      });
    }
  }

  shareViaWhatsApp(): void {
    const msg = this.inviteWhatsappMessage();
    if (msg) {
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }
  }
  @ViewChild('carouselTrack') carouselTrack?: ElementRef<HTMLDivElement>;

  activeFilter = signal<string>('todos');
  searchQuery = signal<string>('');
  currentCardIndex = signal<number>(0);

  showModal = signal<boolean>(false);
  showNotifications = signal<boolean>(false);
  hasUnreadNotifs = signal<boolean>(true);
  showLabDetail = signal<boolean>(false);
  showPromosModal = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  selectedLab = signal<Laboratory | null>(null);
  appliedPromo = signal<PromotionItem | null>(null);
  selectedDate = signal<string>('hoy');
  selectedTime = signal<string | null>(null);

  // Payment State
  selectedPaymentMethod = signal<'tarjeta' | 'recepcion' | 'transferencia'>('tarjeta');
  cardNumber = signal<string>('•••• •••• •••• 4242');
  cardHolder = signal<string>('CARLOS ANDRADE');
  cardExpiry = signal<string>('12/28');
  cardCvv = signal<string>('888');

  // Loading states
  loadingModal = signal<boolean>(false);
  loadingConfirm = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  promotions: PromotionItem[] = [
    {
      id: 1,
      title: '35% OFF · Perfil Lipídico Completo',
      subtitle: 'Colesterol total, HDL, LDL, Triglicéridos y VLDL con entrega express en 4h.',
      discountBadge: '35% DESCUENTO',
      labName: 'Laboratorio San José',
      labId: 1,
      originalPrice: 38.00,
      promoPrice: 24.50,
      validUntil: 'Válido hasta fin de mes',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      tags: ['Salud Cardiovascular', 'Ayuno 8h', 'Express'],
    },
    {
      id: 2,
      title: '30% OFF · Chequeo Preventivo Integral Mujer',
      subtitle: 'Citología, Perfil Hormonal, Biometría hemática y Glucosa.',
      discountBadge: '30% DESCUENTO',
      labName: 'Clínica de la Mujer',
      labId: 2,
      originalPrice: 55.00,
      promoPrice: 38.50,
      validUntil: 'Disponible esta semana',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      tags: ['Salud Femenina', 'Especialistas', 'Pase QR'],
    },
    {
      id: 3,
      title: '2x1 · Glucosa + Hemograma Completo',
      subtitle: 'Llévate dos análisis esenciales pagando solo uno. Ideal para control de rutina.',
      discountBadge: 'PROMO 2x1',
      labName: 'BioCheck Valle & Cumbayá',
      labId: 5,
      originalPrice: 30.00,
      promoPrice: 15.00,
      validUntil: 'Cupos limitados',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
      tags: ['Control General', 'Resultados Hoy', '2x1'],
    },
    {
      id: 4,
      title: '25% OFF · Perfil Tiroideo T3, T4 & TSH',
      subtitle: 'Evaluación completa de función tiroidea por quimioluminiscencia de alta precisión.',
      discountBadge: '25% DESCUENTO',
      labName: 'Laboratorios Integrales',
      labId: 3,
      originalPrice: 48.00,
      promoPrice: 36.00,
      validUntil: 'Válido todo agosto',
      image: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=600&q=80',
      tags: ['Endocrinología', 'Alta Precisión'],
    },
  ];

  notifications: NotificationItem[] = [
    {
      id: 1,
      title: '¡Cita Confirmada!',
      message: 'Tu cita en Laboratorio San José está programada con éxito. Pase QR disponible.',
      time: 'Hace 5 min',
      unread: true,
      type: 'appointment',
    },
    {
      id: 2,
      title: 'Promoción del Mes 🏷️',
      message: 'Aprovecha un 35% de descuento en el Perfil Lipídico Completo en Laboratorio San José.',
      time: 'Hace 1 hora',
      unread: true,
      type: 'promo',
    },
    {
      id: 3,
      title: 'Pase Verde de Salud',
      message: 'Tus resultados anteriores se cargaron correctamente en tu Pase Verde.',
      time: 'Ayer',
      unread: false,
      type: 'info',
    },
    {
      id: 4,
      title: 'Nueva Sede Cercana 📍',
      message: 'Laboratorio San José abrió su nueva sucursal en Av. Amazonas.',
      time: 'Hace 2 días',
      unread: false,
      type: 'info',
    },
  ];

  laboratories: Laboratory[] = [
    {
      id: 1,
      name: 'Laboratorio San José',
      distance: '1.2 km',
      address: 'Av. Amazonas N24-102 y Cordero',
      specialty: 'Rutina General & Bioquímica Clínica',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      phone: '+593 2 234-5678',
      branch: 'Sucursal Central',
      category: 'rutina',
      badge: 'TOP ELECCIÓN',
      reviewsCount: 142,
      prices: [
        { name: 'Hemograma Completo + Plaquetas', price: 18.00, originalPrice: 25.00, discount: '-28%', icon: '🩸' },
        { name: 'Perfil Lipídico Completo (Promo)', price: 24.50, originalPrice: 38.00, discount: '-35%', icon: '🧪' },
        { name: 'Glucosa en Sangre (Ayunas)', price: 8.00, originalPrice: 10.00, icon: '💉' },
        { name: 'Examen General de Orina (EMO)', price: 6.50, icon: '🔬' },
        { name: 'Perfil Tiroideo (T3, T4, TSH)', price: 34.00, originalPrice: 45.00, discount: '-24%', icon: '🧬' },
        { name: 'Ácido Úrico, Urea y Creatinina', price: 14.00, icon: '🫘' },
      ]
    },
    {
      id: 2,
      name: 'Clínica de la Mujer',
      distance: '2.5 km',
      address: 'Av. Eloy Alfaro y Rep. del Salvador',
      specialty: 'Salud Integral & Exámenes Especializados',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      phone: '+593 2 345-6789',
      branch: 'Sede Norte',
      category: 'cercanas',
      badge: 'POPULAR',
      reviewsCount: 98,
      prices: [
        { name: 'Chequeo Ginecológico & Citología', price: 38.50, originalPrice: 55.00, discount: '-30%', icon: '🩺' },
        { name: 'Perfil Hormonal Femenino Completo', price: 42.00, originalPrice: 60.00, discount: '-30%', icon: '🧬' },
        { name: 'Biometría Hemática & Prenatal', price: 22.00, icon: '🩸' },
        { name: 'Glucosa e Insulina Basal', price: 14.00, icon: '💉' },
        { name: 'Ecografía Pélvica y Mamaria', price: 45.00, originalPrice: 58.00, icon: '🔬' },
      ]
    },
    {
      id: 3,
      name: 'Laboratorios Integrales',
      distance: '3.1 km',
      address: 'Av. 6 de Diciembre N25-60 y Colón',
      specialty: 'Inmunología, Genética & Microbiología',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=800&q=80',
      phone: '+593 2 456-7890',
      branch: 'Sede Centro-Norte',
      category: 'todos',
      badge: 'ALTA PRECISIÓN',
      reviewsCount: 76,
      prices: [
        { name: 'Perfil Tiroideo T3, T4, TSH (Promo)', price: 36.00, originalPrice: 48.00, discount: '-25%', icon: '🧬' },
        { name: 'Inmunología & Anticuerpos Panel', price: 38.00, originalPrice: 50.00, icon: '🔬' },
        { name: 'Hemograma Automatizado 5 Estirpes', price: 16.00, icon: '🩸' },
        { name: 'Perfil Lipídico & Hepático', price: 28.00, originalPrice: 40.00, discount: '-30%', icon: '🧪' },
        { name: 'Prueba de Alergias (Panel 20)', price: 65.00, originalPrice: 85.00, discount: '-23%', icon: '🌱' },
      ]
    },
    {
      id: 4,
      name: 'MedLab Centro Clínico',
      distance: '1.8 km',
      address: 'Av. América N32-100 y Mariana de Jesús',
      specialty: 'Hematología, Perfiles & Diagnóstico Express',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      phone: '+593 2 567-8901',
      branch: 'Sede La Mariscal',
      category: 'rutina',
      badge: 'EXPRESS',
      reviewsCount: 110,
      prices: [
        { name: 'Perfil Metabólico General Express', price: 26.00, originalPrice: 35.00, discount: '-25%', icon: '⚡' },
        { name: 'Glucosa & Curva de Tolerancia', price: 15.00, icon: '💉' },
        { name: 'Perfil Renal (Urea, Creatinina, EMO)', price: 19.00, icon: '🫘' },
        { name: 'Hemograma Express 1 Hora', price: 15.00, icon: '🩸' },
        { name: 'Coagulación TP & TTP', price: 12.00, icon: '🧪' },
      ]
    },
    {
      id: 5,
      name: 'BioCheck Valle & Cumbayá',
      distance: '0.9 km',
      address: 'Av. Interoceánica km 10.5 y Florencia',
      specialty: 'Chequeos Preventivos & Análisis de Sangre',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      phone: '+593 2 678-9012',
      branch: 'Sede Cumbayá',
      category: 'cercanas',
      badge: 'PREMIUM',
      reviewsCount: 84,
      prices: [
        { name: '2x1 Glucosa + Hemograma Completo', price: 15.00, originalPrice: 30.00, discount: '2x1', icon: '🎁' },
        { name: 'Chequeo Preventivo Integral VIP', price: 49.00, originalPrice: 75.00, discount: '-34%', icon: '⭐' },
        { name: 'Perfil Lipídico Avanzado', price: 29.00, originalPrice: 42.00, discount: '-30%', icon: '🧪' },
        { name: 'Vitamina D & Calcio Iónico', price: 26.00, icon: '☀️' },
        { name: 'Marcadores Preventivos de Salud', price: 58.00, originalPrice: 70.00, icon: '🧬' },
      ]
    },
  ];

  examTypes: ExamType[] = [
    { id: 1, name: 'Examen de Rutina General', price: 18.00, selected: true },
    { id: 2, name: 'Perfil Lipídico Completo (Promo)', price: 24.50, selected: false },
    { id: 3, name: 'Hemograma Automatizado', price: 16.00, selected: false },
    { id: 4, name: 'Prueba de Glucosa en Ayunas', price: 8.00, selected: false },
    { id: 5, name: 'Perfil Tiroideo TSH', price: 34.00, selected: false },
  ];

  timeSlots: TimeSlot[] = [
    { time: '08:00 AM', selected: true },
    { time: '09:30 AM', selected: false },
    { time: '10:30 AM', selected: false },
    { time: '11:45 AM', selected: false },
    { time: '02:00 PM', selected: false },
    { time: '04:30 PM', selected: false },
  ];

  /** Cálculo dinámico del total de la cita express con o sin promoción */
  get selectedExamsTotal(): number {
    if (this.appliedPromo()) {
      return this.appliedPromo()!.originalPrice;
    }
    const selected = this.examTypes.filter(e => e.selected);
    if (selected.length === 0) return 0;
    return selected.reduce((acc, curr) => acc + (curr.originalPrice || curr.price), 0);
  }

  get discountCheckUp(): number {
    if (this.appliedPromo()) {
      const promo = this.appliedPromo()!;
      return Number((promo.originalPrice - promo.promoPrice).toFixed(2));
    }
    // Descuento SÓLO para los exámenes seleccionados que tienen promoción/descuento real
    const selectedWithDiscount = this.examTypes.filter(e => e.selected && e.originalPrice && e.originalPrice > e.price);
    const totalDiscount = selectedWithDiscount.reduce((acc, curr) => acc + (curr.originalPrice! - curr.price), 0);
    return Number(totalDiscount.toFixed(2));
  }

  get finalTotal(): number {
    if (this.appliedPromo()) {
      return this.appliedPromo()!.promoPrice;
    }
    const selected = this.examTypes.filter(e => e.selected);
    if (selected.length === 0) return 0;
    return Number(selected.reduce((acc, curr) => acc + curr.price, 0).toFixed(2));
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.currentCardIndex.set(0);
    this.scrollTrackTo(0);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentCardIndex.set(0);
    this.scrollTrackTo(0);
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
    if (this.showNotifications()) {
      this.hasUnreadNotifs.set(false);
      this.notifications.forEach(n => n.unread = false);
    }
  }

  get filteredLabs(): Laboratory[] {
    const query  = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();

    return this.laboratories.filter(lab => {
      let matchesCategory = true;
      if (filter === 'rutina') {
        matchesCategory = lab.specialty.toLowerCase().includes('rutina') || lab.category === 'rutina';
      } else if (filter === 'cercanas') {
        const distNum = parseFloat(lab.distance);
        matchesCategory = distNum <= 2.5 || lab.category === 'cercanas';
      }

      let matchesSearch = true;
      if (query) {
        matchesSearch =
          lab.name.toLowerCase().includes(query) ||
          lab.address.toLowerCase().includes(query) ||
          lab.specialty.toLowerCase().includes(query) ||
          lab.branch.toLowerCase().includes(query);
      }

      return matchesCategory && matchesSearch;
    });
  }

  nextCard() {
    const labs = this.filteredLabs;
    if (labs.length <= 1) return;
    const nextIdx = (this.currentCardIndex() + 1) % labs.length;
    this.currentCardIndex.set(nextIdx);
    this.scrollTrackTo(nextIdx);
  }

  prevCard() {
    const labs = this.filteredLabs;
    if (labs.length <= 1) return;
    const prevIdx = (this.currentCardIndex() - 1 + labs.length) % labs.length;
    this.currentCardIndex.set(prevIdx);
    this.scrollTrackTo(prevIdx);
  }

  goToCard(index: number) {
    this.currentCardIndex.set(index);
    this.scrollTrackTo(index);
  }

  private scrollTrackTo(index: number) {
    if (!this.carouselTrack?.nativeElement) return;
    const track = this.carouselTrack.nativeElement;
    const firstCard = track.querySelector('.lab-slider-card') as HTMLElement;
    const cardWidth = firstCard ? (firstCard.offsetWidth + 20) : 380;
    track.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  }

  /** Abrir enlace a Google Maps con la ubicación exacta */
  openGoogleMaps(lab: Laboratory | null, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!lab) return;
    const query = encodeURIComponent(`${lab.name} ${lab.address} Quito Ecuador`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  }

  /** Promociones Modal */
  openPromosModal() {
    this.showPromosModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closePromosModal() {
    this.showPromosModal.set(false);
    document.body.style.overflow = '';
  }

  applyPromo(promo: PromotionItem) {
    this.closePromosModal();
    this.appliedPromo.set(promo);
    const lab = this.laboratories.find(l => l.id === promo.labId) || this.laboratories[0];
    this.selectedLab.set(lab);
    
    // Cargar los exámenes específicos del laboratorio seleccionado
    this.examTypes = lab.prices.map((p, idx) => {
      const isTargetPromo = p.discount === promo.discountBadge || 
                            p.name.toLowerCase().includes('promo') ||
                            p.name.toLowerCase().includes('2x1') ||
                            idx === 0;
      return {
        id: idx + 1,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        hasDiscount: !!p.originalPrice && p.originalPrice > p.price,
        selected: isTargetPromo
      };
    });

    this.showModal.set(true);
    this.selectedDate.set('hoy');
    this.selectedTime.set('08:00 AM');
    this.selectedPaymentMethod.set('tarjeta');
    this.timeSlots.forEach((t, idx) => (t.selected = idx === 0));
    document.body.style.overflow = 'hidden';
  }

  /** Abrir modal de detalles del lab */
  openLabDetail(lab: Laboratory | null) {
    if (!lab) return;
    this.selectedLab.set(lab);
    this.showLabDetail.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLabDetail() {
    this.showLabDetail.set(false);
    document.body.style.overflow = '';
  }

  /** Desde el modal de detalles → abrir agendamiento express */
  openModalFromDetail() {
    this.closeLabDetail();
    const lab = this.selectedLab();
    if (lab) this.openModal(lab);
  }

  /** Abrir modal de agendamiento (con loading 1.2s) */
  openModal(lab: Laboratory) {
    this.appliedPromo.set(null); // Limpiar promo específica si es agendamiento regular
    this.loadingModal.set(true);
    document.body.style.overflow = 'hidden';

    // Cargar los exámenes específicos del laboratorio seleccionado
    this.examTypes = lab.prices.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      hasDiscount: !!p.originalPrice && p.originalPrice > p.price,
      selected: idx === 0
    }));

    setTimeout(() => {
      this.loadingModal.set(false);
      this.selectedLab.set(lab);
      this.showModal.set(true);
      this.selectedDate.set('hoy');
      this.selectedTime.set('08:00 AM');
      this.selectedPaymentMethod.set('tarjeta');
      this.timeSlots.forEach((t, idx) => (t.selected = idx === 0));
    }, 1000);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedLab.set(null);
    this.loadingConfirm.set(false);
    document.body.style.overflow = '';
  }

  selectDate(date: string) { this.selectedDate.set(date); }

  selectTime(slot: TimeSlot) {
    this.timeSlots.forEach(t => (t.selected = false));
    slot.selected = true;
    this.selectedTime.set(slot.time);
  }

  toggleExam(exam: ExamType) { 
    exam.selected = !exam.selected;
    // ensure at least one is selected
    const anySelected = this.examTypes.some(e => e.selected);
    if (!anySelected) {
      exam.selected = true;
    }
  }

  setPaymentMethod(method: 'tarjeta' | 'recepcion' | 'transferencia') {
    this.selectedPaymentMethod.set(method);
  }

  private appointmentService = inject(AppointmentService);

  /** Confirmar cita: envía a PostgreSQL -> spinner -> success modal */
  async confirmAppointment() {
    this.loadingConfirm.set(true);

    const lab = this.selectedLab() || this.laboratories[0];
    const labIdMap: { [key: number]: string } = {
      1: 'lab-zurita-centronorte',
      2: 'lab-mujer-eloyalfaro',
      3: 'lab-medlab-mariscal',
      4: 'lab-medlab-mariscal',
      5: 'lab-biocheck-cumbaya'
    };

    const targetLabId = labIdMap[lab.id] || 'lab-zurita-centronorte';
    const targetExamId = this.appliedPromo() ? 'exam-ets-completo' : 'exam-rutina-completa';

    const selectedExams = this.examTypes.filter(e => e.selected);
    const selectedExamTitle = selectedExams.length > 0
      ? selectedExams.map(e => e.name).join(' + ')
      : (this.appliedPromo()?.title || 'Chequeo Clínico');

    try {
      await this.appointmentService.bookAppointment(
        targetLabId,
        targetExamId,
        this.selectedDate(),
        this.selectedTime() || '08:00 AM',
        this.finalTotal,
        selectedExamTitle
      );
    } catch (e) {
      console.error('Error al guardar en backend:', e);
    }

    setTimeout(() => {
      this.loadingConfirm.set(false);
      this.showModal.set(false);
      this.showSuccess.set(true);

      setTimeout(() => {
        this.showSuccess.set(false);
        this.selectedLab.set(null);
        document.body.style.overflow = '';
      }, 2400);
    }, 1200);
  }
}
