/**
 * CheckUp+ Domain Models & Type Definitions
 * Aligned with specs/001-checkup-plus/data-model.md
 */

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  city: string;
  pinHash: string;
  biometricsEnabled: boolean;
  privacyBlurEnabled: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  cedula?: string;
  age?: number;
  dob?: string;
  gender?: string;
  bloodType?: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bmiStatus?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  insurance?: string;
  policyNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type SectorQuito = 'Norte' | 'Centro' | 'Sur' | 'Valles' | 'Cumbayá';

export type ExamCategory = 'salud_sexual' | 'rutina_preventiva' | 'perfil_hormonal' | 'chequeo_completo';

export interface AlliedLaboratory {
  id: string;
  name: string;
  address: string;
  sector: SectorQuito;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  openingHours: string;
  availableTests: ExamCategory[];
  phone: string;
  image?: string;
}

export interface ExamCatalogItem {
  id: string;
  title: string;
  category: ExamCategory;
  description: string;
  estimatedTurnaroundHours: number;
  sampleType: 'Sangre' | 'Orina' | 'Hisopado' | 'Combinado';
  fastingRequired: boolean;
  priceUSD: number;
  preparationInstructions: string[];
}

export type AppointmentStatus = 'CONFIRMED' | 'CHECKED_IN' | 'SAMPLE_TAKEN' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  userId: string;
  laboratoryId: string;
  laboratoryName: string;
  examId: string;
  examTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  checkInQrCode: string;
  checkInTimestamp?: string;
  totalAmountUSD: number;
  createdAt: string;
}

export type ParameterStatus = 'NORMAL' | 'ELEVATED' | 'LOW' | 'POSITIVE' | 'NEGATIVE' | 'ATTENTION';

export interface ClinicalParameter {
  id: string;
  name: string;
  rawResult: string;
  numericValue?: number;
  unit?: string;
  referenceRange: string;
  status: ParameterStatus;
  aiExplanation?: string;
  notes?: string;
}

export interface AIInterpretation {
  summary: string;
  simplifiedKeyPoints: string[];
  followUpRecommendations: string[];
  positiveAspects?: string[];
  actionPoints?: string[];
  faq?: any[];
  disclaimer: string;
  confidenceScore: number;
  analyzedAt: string;
}

export interface ClinicalResult {
  id: string;
  userId: string;
  appointmentId?: string;
  laboratoryId: string;
  laboratoryName: string;
  examTitle: string;
  specialty?: string;
  category: ExamCategory;
  dateProcessed: string;
  statusSummary: 'OPTIMAL' | 'REVIEW_REQUIRED' | string;
  parameters: ClinicalParameter[];
  aiAnalysis?: AIInterpretation;
  pdfUrl?: string;
  doctorSignature?: string;
  technicalSummary?: string;
  icd10Code?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
  };
  technicalFindings?: string[];
  recommendations?: string[];
  dietAndLifestyle?: string[];
  followUpInstructions?: string;
  warningSignals?: string[];
  prescriptions?: any[];
  nextAppointment?: any;
}

export interface GreenPass {
  passToken: string;
  userId: string;
  status: 'AL_DIA' | 'PENDIENTE' | 'VENCIDO';
  lastCheckupDate: string;
  validUntil: string;
  qrPayload: string;
  isDynamicRotated: boolean;
}

export interface CoupleInvitation {
  id: string;
  senderAlias: string;
  inviteCode: string;
  customMessage?: string;
  preferredExamCategory?: ExamCategory;
  shareableUrl: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
}
