import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { ResultsService } from '../services/results.service';
import { ClinicalResult } from '../models/checkup.types';

export interface PatientProfile {
  fullName: string;
  avatar: string;
  patientId: string;
  cedula: string;
  age: number;
  dob: string;
  gender: string;
  bloodType: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiStatus: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  insurance: string;
  policyNumber: string;
}

export interface BiomarkerResult {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'warning' | 'optimal' | 'critical';
  notes?: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface MedicalAppointmentResult {
  id: string;
  title: string;
  specialty: string;
  category: 'Cardiología' | 'Laboratorio' | 'Radiología' | 'Oftalmología' | 'Endocrinología';
  status: 'Completado' | 'En revisión' | 'Interpretado con IA';
  badgeClass: 'badge-success' | 'badge-info' | 'badge-warning' | 'badge-purple';
  
  // Fechas y Horas
  appointmentDate: string;
  appointmentTime: string;
  issuedDate: string;
  duration: string;
  
  // Médico e Institución
  doctorName: string;
  doctorSpecialty: string;
  doctorReg: string;
  facilityName: string;
  roomNumber: string;
  
  // Descripción Técnica y Diagnóstico
  technicalSummary: string;
  icd10Code: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation: string;
    respiratoryRate: string;
  };
  labBiomarkers: BiomarkerResult[];
  technicalFindings: string[];
  
  // Recomendaciones y Tratamiento
  recommendations: string[];
  prescriptions: Prescription[];
  dietAndLifestyle: string[];
  
  // Seguimiento y Alertas
  followUpInstructions: string;
  warningSignals: string[];
  
  // Información de Próximas Citas
  nextAppointment: {
    suggestedDate: string;
    suggestedTime: string;
    specialty: string;
    doctor: string;
    facility: string;
    status: 'Agendada' | 'Sugerida';
    notes: string;
  };

  // AI Summary data
  aiSummary: {
    plainLanguageExplanation: string;
    keyTakeaways: string[];
    positiveAspects: string[];
    actionPoints: string[];
    faq: { question: string; answer: string }[];
    quickTakeaway?: string;
    keyObservations?: string[];
    lifestyleTips?: string[];
    suggestedQuestionsForDoctor?: string[];
    urgencyLevel?: 'baja' | 'moderada' | 'alta';
    disclaimer?: string;
  };
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrl: './results.css'
})
export class Results {
  private authService = inject(AuthService);

  // Ficha Médica del Paciente dynamically loaded from authenticated user
  get patient(): PatientProfile {
    const u = this.authService.currentUser();
    return {
      fullName: u?.fullName || 'Paciente CheckUp+',
      avatar: 'https://i.pravatar.cc/150?img=33',
      patientId: u?.id || 'PV159800314791',
      cedula: u?.cedula || '1700000000',
      age: u?.age || 30,
      dob: u?.dob || '14 de Mayo, 1996',
      gender: u?.gender || 'No especificado',
      bloodType: u?.bloodType || 'O Rh Positive (O+)',
      weightKg: u?.weightKg || 70.0,
      heightCm: u?.heightCm || 170,
      bmi: u?.bmi || 24.2,
      bmiStatus: u?.bmiStatus || 'Peso Normal / Saludable',
      allergies: u?.allergies || ['Ninguna reportada'],
      chronicConditions: u?.chronicConditions || ['Ninguna reportada'],
      emergencyContact: {
        name: u?.emergencyContact?.name || 'Contacto de Emergencia',
        relation: u?.emergencyContact?.relation || 'Familiar',
        phone: u?.emergencyContact?.phone || '+593 99 000 0000'
      },
      insurance: u?.insurance || 'Particular',
      policyNumber: u?.policyNumber || 'N/A'
    };
  }

  // State management
  selectedCategory = signal<string>('Todas');
  searchQuery = signal<string>('');
  selectedResultId = signal<string | null>(null);
  
  // Modal IA State
  showAiModal = signal<boolean>(false);
  aiTab = signal<'explicacion' | 'puntos' | 'faq'>('explicacion');
  isSpeakingAi = signal<boolean>(false);

  // Toast notifications
  toastMessage = signal<string | null>(null);

  // Categorías de filtro
  categories: string[] = ['Todas', 'Cardiología', 'Laboratorio', 'Radiología', 'Oftalmología', 'Endocrinología'];

  // Citas Médicas con Resultados Técnicos
  appointmentResults: MedicalAppointmentResult[] = [
    {
      id: 'res-cardio-01',
      title: 'Chequeo Cardiovascular Integral & Perfil Lipídico',
      specialty: 'Cardiología Especializada',
      category: 'Cardiología',
      status: 'Interpretado con IA',
      badgeClass: 'badge-purple',
      
      appointmentDate: '15 de Agosto de 2026',
      appointmentTime: '10:30 AM - 11:20 AM',
      issuedDate: '15 de Agosto de 2026, 14:15 PM',
      duration: '50 minutos',
      
      doctorName: 'Dr. Carlos Mendoza S.',
      doctorSpecialty: 'Especialista en Cardiología Clínica y Hemodinámica',
      doctorReg: 'MSP-0984920-CARD',
      facilityName: 'Hospital Metropolitano - Sede Central Quito',
      roomNumber: 'Consultorio 402, Torre Médica A',
      
      technicalSummary: 'Paciente masculino de 38 años asintomático en reposo. Se realiza evaluación cardiovascular de control periódico. Tensión arterial dentro de rangos normales altos en consulta. ECG de 12 derivaciones muestra ritmo sinusal adecuado sin signos de sobrecarga ventricular ni anomalías isquémicas agudas. Perfil lipídico evidencia moderado incremento de fracción LDL con HDL óptimo.',
      icd10Code: 'I10 - Hipertensión Esencial (Primaria) en observación',
      
      vitalSigns: {
        bloodPressure: '122 / 78 mmHg',
        heartRate: '72 lpm (Normocardia)',
        temperature: '36.6 °C',
        oxygenSaturation: '98% SpO2 (Aire ambiente)',
        respiratoryRate: '16 rpm'
      },
      
      labBiomarkers: [
        { name: 'Colesterol Total', value: '185', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'normal', notes: 'Rango deseable' },
        { name: 'Colesterol HDL', value: '54', unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'optimal', notes: 'Efecto cardioprotector adecuado' },
        { name: 'Colesterol LDL (Calculado)', value: '108', unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'warning', notes: 'Discretamente por encima de meta idónea' },
        { name: 'Triglicéridos Basales', value: '135', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'normal', notes: 'Controlado' },
        { name: 'Glucosa en Ayunas', value: '91', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', status: 'optimal', notes: 'Normoglucemia' },
        { name: 'Proteína C Reactiva Ultrasensible', value: '0.8', unit: 'mg/L', referenceRange: '< 1.0 mg/L', status: 'normal', notes: 'Bajo riesgo inflamatorio vascular' }
      ],
      
      technicalFindings: [
        'Ritmo sinusal regular a 72 lpm con eje eléctrico a +45 grados.',
        'Intervalos PR (150ms) y QRS (88ms) dentro de límites fisiológicos normotípicos.',
        'Ausencia de soplos cardiacos ni galopes a la auscultación focalizada.',
        'Pulsos periféricos distales simétricos, normoesfígmicos y conservados en 4 extremidades.',
        'Estima de riesgo cardiovascular global según Framingham: Bajo (< 5% a 10 años).'
      ],
      
      recommendations: [
        'Mantener régimen de ejercicio aeróbico regular (mínimo 150 minutos a la semana).',
        'Prescripción profiláctica: Atorvastatina 10mg en la noche por 60 días para optimizar meta de LDL < 100 mg/dL.',
        'Reducir consumo de sodio en la dieta diaria a menos de 2.000 mg/día.',
        'Revisión domiciliaria de presión arterial 2 veces por semana al despertar.'
      ],
      
      prescriptions: [
        {
          medication: 'Atorvastatina 10mg Comprimidos',
          dosage: '1 comprimido vía oral',
          frequency: 'Una vez al día (por la noche)',
          duration: '60 días',
          instructions: 'Tomar preferiblemente después de la cena con abundante agua.'
        }
      ],
      
      dietAndLifestyle: [
        'Adopción estricta de la dieta tipo DASH / Mediterránea rica en omega-3, verduras y frutos secos.',
        'Evitar consumo de grasas trans y limitar carbohidratos ultraprocesados.',
        'Práctica regular de técnicas de control de estrés y optimización de sueño (7-8 horas nocturnas).'
      ],
      
      followUpInstructions: 'Solicitar examen de control de perfil lipídico de 6 dígitos en 90 días. Si presenta cefalea intensa persistente o dolor torácico, acudir de inmediato al servicio de urgencias.',
      warningSignals: [
        'Dolor u opresión en el pecho que se irradie al brazo izquierdo o mandíbula.',
        'Presión arterial sistólica mayor a 140 mmHg sostenida en tres tomas.',
        'Dificultad repentina para respirar (disnea de esfuerzo leve).'
      ],
      
      nextAppointment: {
        suggestedDate: '18 de Noviembre de 2026',
        suggestedTime: '09:30 AM',
        specialty: 'Cardiología de Control',
        doctor: 'Dr. Carlos Mendoza S.',
        facility: 'Hospital Metropolitano - Consultorio 402',
        status: 'Sugerida',
        notes: 'Cita de seguimiento para evaluar respuesta a Atorvastatina 10mg y nuevos exámenes de laboratorio.'
      },
      
      aiSummary: {
        plainLanguageExplanation: '¡Excelentes noticias sobre tu corazón! El Dr. Mendoza confirmó que tu ritmo cardíaco y tu presión arterial están en muy buen estado. Tu cuerpo está funcionando de forma saludable. El único detalle menor es que tu colesterol "malo" (LDL) está apenas unas cuantas unidades por encima de lo ideal (108 cuando lo óptimo es menos de 100). Por eso el médico te recetó una dosis suave de Atorvastatina por 2 meses para dejarlo impecable.',
        keyTakeaways: [
          'Tu corazón está fuerte y latiendo a un ritmo perfecto (72 latidos por minuto).',
          'Tu colesterol "bueno" (HDL) te protege adecuadamente.',
          'Debes tomar 1 pastilla de Atorvastatina 10mg por las noches.',
          'La próxima revisión será dentro de 3 meses en Noviembre.'
        ],
        positiveAspects: [
          'Presión arterial excelente: 122/78 mmHg.',
          'Nivel de azúcar en sangre (glucosa) en perfecto estado (91 mg/dL).',
          'Sin inflamación en las arterias (Proteína C reactiva en 0.8).'
        ],
        actionPoints: [
          'Tomar Atorvastatina 10mg cada noche tras la cena.',
          'Caminar o hacer 30 minutos de ejercicio 5 días a la semana.',
          'Reducir un poco la sal en la comida diaria.'
        ],
        faq: [
          { question: '¿Es grave tener el LDL en 108?', answer: 'No, no es grave en absoluto. Es solo un nivel ligeramente elevado que se corrige fácilmente con hábitos saludables y el tratamiento leve recomendado.' },
          { question: '¿Puedo hacer ejercicio con normalidad?', answer: 'Sí, totalmente. Se recomienda actividad física aeróbica regular como caminatas a paso ligero, natación o ciclismo.' },
          { question: '¿Cuándo debo tomar mi medicamento?', answer: 'Por la noche antes de dormir, ya que el hígado sintetiza la mayor parte del colesterol durante las horas nocturnas.' }
        ]
      }
    },

    {
      id: 'res-lab-02',
      title: 'Biometría Hemática & Bioquímica Sanguínea Completa',
      specialty: 'Laboratorio Clínico y Hematología',
      category: 'Laboratorio',
      status: 'Completado',
      badgeClass: 'badge-success',
      
      appointmentDate: '28 de Julio de 2026',
      appointmentTime: '07:30 AM - 08:00 AM',
      issuedDate: '28 de Julio de 2026, 16:30 PM',
      duration: '30 minutos',
      
      doctorName: 'Dra. Valeria Ruales P.',
      doctorSpecialty: 'Especialista en Patología Clínica y Hematología',
      doctorReg: 'LAB-774029-MSP',
      facilityName: 'Laboratorio Central San José - Sucursal Eloy Alfaro',
      roomNumber: 'Móvil de Toma de Muestra 02',
      
      technicalSummary: 'Panel bioquímico completo en sangre periférica. Serie roja, blanca y plaquetaria sin alteraciones morfológicas ni cuantitativas. Función renal (Urea y Creatinina) conservadas. Enzimas hepáticas (TGO/TGP) dentro de rangos normales de referencia.',
      icd10Code: 'Z00.0 - Examen médico general de rutina sin hallazgos anormales',
      
      vitalSigns: {
        bloodPressure: '118 / 76 mmHg',
        heartRate: '68 lpm',
        temperature: '36.5 °C',
        oxygenSaturation: '99% SpO2',
        respiratoryRate: '15 rpm'
      },
      
      labBiomarkers: [
        { name: 'Hemoglobina', value: '15.4', unit: 'g/dL', referenceRange: '13.5 - 17.5 g/dL', status: 'optimal', notes: 'Normocítica normocrómica' },
        { name: 'Leucocitos Totales', value: '6,800', unit: '/mm³', referenceRange: '4,500 - 11,000', status: 'normal', notes: 'Fórmula leucocitaria balanceada' },
        { name: 'Plaquetas', value: '245,000', unit: '/mm³', referenceRange: '150,000 - 450,000', status: 'normal', notes: 'Recuento adecuado' },
        { name: 'Creatinina Sérica', value: '0.92', unit: 'mg/dL', referenceRange: '0.70 - 1.30 mg/dL', status: 'optimal', notes: 'Filtrado glomerular estimado > 90 mL/min' },
        { name: 'Nitrógeno Ureico (BUN)', value: '14.2', unit: 'mg/dL', referenceRange: '7.0 - 20.0 mg/dL', status: 'normal', notes: 'Normofunción renal' },
        { name: 'TGO / AST Hepática', value: '22', unit: 'U/L', referenceRange: '< 40 U/L', status: 'optimal', notes: 'Enzima hepática normal' },
        { name: 'TGP / ALT Hepática', value: '26', unit: 'U/L', referenceRange: '< 41 U/L', status: 'optimal', notes: 'Enzima hepática normal' }
      ],
      
      technicalFindings: [
        'Frotis de sangre periférica: Eritrocitos de morfología normal, leucocitos bien diferenciados.',
        'Ausencia de células inmaduras o atipias hematológicas.',
        'Electrolitos séricos (Sodio: 140 mEq/L, Potasio: 4.2 mEq/L) en equilibrio hidroelectrolítico idóneo.'
      ],
      
      recommendations: [
        'Continuar con hábitos de hidratación adecuada (2 litros de agua diarios).',
        'Mantener dieta balanceada variada en micronutrientes y vitaminas.',
        'Repetir biometría de control anual de rutina.'
      ],
      
      prescriptions: [],
      
      dietAndLifestyle: [
        'Consumo regular de alimentos ricos en hierro biodisponible (legumbres, vegetales verdes).',
        'Evitar consumo excesivo de bebidas azucaradas.'
      ],
      
      followUpInstructions: 'No requiere tratamiento farmacológico. Presentar estos resultados en su próxima consulta médica general.',
      warningSignals: [
        'Aparición inexplicada de hematomas o sangrado de encías.',
        'Fatiga extrema sin causa aparente.'
      ],
      
      nextAppointment: {
        suggestedDate: '28 de Julio de 2027',
        suggestedTime: '08:00 AM',
        specialty: 'Laboratorio Anual',
        doctor: 'Dra. Valeria Ruales P.',
        facility: 'Laboratorio San José',
        status: 'Sugerida',
        notes: 'Chequeo preventivo anual recurrente.'
      },
      
      aiSummary: {
        plainLanguageExplanation: 'Todos tus análisis de laboratorio están completamente limpios y saludables. Tus niveles de glóbulos rojos y blancos (defensas) están en perfecto equilibrio, tus riñones están filtrando de manera óptima y tu hígado no muestra ninguna inflamación.',
        keyTakeaways: [
          'No tienes anemia ni signos de infección.',
          'Tus riñones e hígado están trabajando al 100%.',
          'Los electrolitos (sal y potasio en sangre) están perfectos.'
        ],
        positiveAspects: [
          'Hemoglobina fuerte y saludable (15.4 g/dL).',
          'Defensas leucocitarias excelentes (6,800/mm³).',
          'Función renal impecable.'
        ],
        actionPoints: [
          'Mantener tu hidratación diaria con agua pura.',
          'Guardar este informe en tu ficha médica digital.'
        ],
        faq: [
          { question: '¿Tengo anemia?', answer: 'No, tus niveles de hemoglobina están en un punto óptimo y fuerte.' },
          { question: '¿Necesito tomar vitaminas extra?', answer: 'Con tu alimentación actual no es indispensable, tus valores en sangre son muy equilibrados.' }
        ]
      }
    },

    {
      id: 'res-radio-03',
      title: 'Radiografía Digital de Tórax (AP y Lateral)',
      specialty: 'Imagenología y Radiología',
      category: 'Radiología',
      status: 'Completado',
      badgeClass: 'badge-info',
      
      appointmentDate: '10 de Junio de 2026',
      appointmentTime: '11:00 AM - 11:30 AM',
      issuedDate: '10 de Junio de 2026, 15:00 PM',
      duration: '30 minutos',
      
      doctorName: 'Dr. Andrés Benítez G.',
      doctorSpecialty: 'Médico Radiólogo e Especialista en Diagnóstico por Imagen',
      doctorReg: 'RAD-551029-MSP',
      facilityName: 'Centro Radiológico ImagenMed - Sede Cumbayá',
      roomNumber: 'Sala de Rayos X 01',
      
      technicalSummary: 'Estudio radiográfico de tórax en proyecciones Anteroposterior y Lateral izquierda. Campos pulmonares bien expandidos, transparentes y simétricos. Sin evidencia de consolidaciones alveolares, derrames pleurales ni neumotórax. Silueta cardiaca de tamaño y configuración normal.',
      icd10Code: 'Z01.6 - Examen radiológico no clasificado bajo otro concepto',
      
      vitalSigns: {
        bloodPressure: '120 / 80 mmHg',
        heartRate: '70 lpm',
        temperature: '36.6 °C',
        oxygenSaturation: '98% SpO2',
        respiratoryRate: '16 rpm'
      },
      
      labBiomarkers: [],
      
      technicalFindings: [
        'Índice cardiotorácico (ICT) conservado (< 0.50). Sin cardiomegalia.',
        'Árbol traqueobronquial permeable y centrado en línea media.',
        'Senos costofrénicos y cardiofrénicos libres y agudos.',
        'Estructuras óseas de la caja torácica (costillas, clavículas y esternón) de morfología e integridad ósea normal.'
      ],
      
      recommendations: [
        'Sin anomalías parenquimatosas pulmonares. No requiere intervención radiológica inmediata.',
        'Archivar estudio de imagen para comparación comparativa futura si fuera preciso.'
      ],
      
      prescriptions: [],
      dietAndLifestyle: [
        'Evitar ambientes con exposición a contaminantes ambientales o humo de tabaco.'
      ],
      
      followUpInstructions: 'Estudio normal. Mantener controles preventivos habituales.',
      warningSignals: [
        'Aparición de tos persistente por más de 15 días.',
        'Dificultad respiratoria súbita.'
      ],
      
      nextAppointment: {
        suggestedDate: 'Sin fecha inmediata',
        suggestedTime: '-',
        specialty: 'Radiología',
        doctor: 'Dr. Andrés Benítez G.',
        facility: 'ImagenMed Cumbayá',
        status: 'Sugerida',
        notes: 'Estudio de control únicamente bajo requerimiento médico futuro.'
      },
      
      aiSummary: {
        plainLanguageExplanation: 'Tu radiografía de tórax mostró que tus pulmones están completamente limpios, expandidos y libres de cualquier líquido o infección. Tu corazón tiene un tamaño y forma totalmente normales.',
        keyTakeaways: [
          'Pulmones 100% despejados y limpios.',
          'Corazón de tamaño sano y equilibrado.',
          'Costillas y huesos del pecho intactos.'
        ],
        positiveAspects: [
          'Sin sombras ni manchitas pulmonares.',
          'Excelente oxigenación observada.'
        ],
        actionPoints: [
          'Conservar la imagen digital en tu historial.'
        ],
        faq: [
          { question: '¿Se observa algún signo de neumonía o infección?', answer: 'No, los pulmones lucen transparentes y limpios.' }
        ]
      }
    },

    {
      id: 'res-oftal-04',
      title: 'Evaluación Oftalmológica & Tonometría Ocular',
      specialty: 'Oftalmología Diagnóstica',
      category: 'Oftalmología',
      status: 'Completado',
      badgeClass: 'badge-success',
      
      appointmentDate: '02 de Mayo de 2026',
      appointmentTime: '15:30 PM - 16:15 PM',
      issuedDate: '02 de Mayo de 2026, 17:00 PM',
      duration: '45 minutos',
      
      doctorName: 'Dra. Sofía Salazar M.',
      doctorSpecialty: 'Oftalmóloga Cirujana de Córnea y Refracción',
      doctorReg: 'OFT-993012-MSP',
      facilityName: 'Clínica Oftalmológica OftalmoSur',
      roomNumber: 'Consultorio 105',
      
      technicalSummary: 'Examen refractivo y biomicroscópico completo con lámpara de hendidura. Agudeza visual corregida 20/20 bilateral con prescripción oftálmica vigente. Tonometría de aplanación de Goldman muestra presión intraocular (PIO) en rangos de seguridad. Fondo de ojo con papila de bordes nítidos y excavación fisiológica.',
      icd10Code: 'H52.2 - Astigmatismo miópico compuesto leve',
      
      vitalSigns: {
        bloodPressure: '121 / 77 mmHg',
        heartRate: '74 lpm',
        temperature: '36.5 °C',
        oxygenSaturation: '99% SpO2',
        respiratoryRate: '16 rpm'
      },
      
      labBiomarkers: [
        { name: 'Presión Intraocular (Ojo Derecho - OD)', value: '14', unit: 'mmHg', referenceRange: '10 - 21 mmHg', status: 'optimal', notes: 'Tensión ocular normal' },
        { name: 'Presión Intraocular (Ojo Izquierdo - OI)', value: '15', unit: 'mmHg', referenceRange: '10 - 21 mmHg', status: 'optimal', notes: 'Tensión ocular normal' },
        { name: 'Agudeza Visual Corregida', value: '20/20', unit: 'snellen', referenceRange: '20/20', status: 'optimal', notes: 'Visión óptima con lentes' }
      ],
      
      technicalFindings: [
        'Córnea transparente sin distrofias ni erosiones epiteliales.',
        'Cristalino transparente bilateral sin opacidades ni facosclerosis.',
        'Retina aplicada 360 grados sin desgarros ni maculopatías visibles.'
      ],
      
      recommendations: [
        'Utilizar lentes con filtro de luz azul (Blue Defense) al trabajar frente a pantallas por más de 2 horas seguidas.',
        'Aplicar lágrimas artificiales sin conservantes (Hialuronato de Sodio 0.15%) 1 gota en cada ojo cada 6 horas si experimenta sequedad ocular por fatiga digital.'
      ],
      
      prescriptions: [
        {
          medication: 'Hialuronato de Sodio 0.15% Gotas Oftálmicas',
          dosage: '1 gota en cada ojo',
          frequency: 'Cada 6 horas según requerimiento',
          duration: 'Uso libre',
          instructions: 'Lubricante ocular para prevención de fatiga por pantallas.'
        }
      ],
      
      dietAndLifestyle: [
        'Pausa visual 20-20-20: Cada 20 minutos miradas al horizonte a 6 metros durante 20 segundos.'
      ],
      
      followUpInstructions: 'Control oftálmico refractivo y de presión ocular anual.',
      warningSignals: [
        'Visión de destellos luminosos repentinos o manchas oscuras flotantes intensas.',
        'Dolor ocular agudo punzante.'
      ],
      
      nextAppointment: {
        suggestedDate: '02 de Mayo de 2027',
        suggestedTime: '15:00 PM',
        specialty: 'Oftalmología General',
        doctor: 'Dra. Sofía Salazar M.',
        facility: 'Clínica OftalmoSur',
        status: 'Sugerida',
        notes: 'Revisión anual de graduación y presión ocular.'
      },
      
      aiSummary: {
        plainLanguageExplanation: 'Tu revisión de la vista salió perfecta. Tu presión ocular está en niveles óptimos (lo que descarta riesgo de glaucoma) y con tus gafas ves al 100% (20/20). Solo debes protegerte de la fatiga de las pantallas usando gotas lubricantes si sientes los ojos secos.',
        keyTakeaways: [
          'Visión 20/20 impecable con tus lentes.',
          'Presión ocular totalmente saludable.',
          'Retina y cristalino transparentes y sin daños.'
        ],
        positiveAspects: [
          'Presión intraocular ideal (14-15 mmHg).',
          'Sin inflamación ocular.'
        ],
        actionPoints: [
          'Usar filtro azul en tus anteojos para computadora.',
          'Ponerte 1 gota de lágrimas artificiales si sientes cansancio en los ojos.'
        ],
        faq: [
          { question: '¿Aumentó mi graduación?', answer: 'No, tu graduación de astigmatismo se mantiene estable.' }
        ]
      }
    }
  ];

  private resultsService = inject(ResultsService);

  // Dynamic merged results (DB results + default clinical cases)
  get allResults(): MedicalAppointmentResult[] {
    const dbResults = this.resultsService.clinicalResults();
    const mappedDb: MedicalAppointmentResult[] = dbResults.map(r => {
      const dateObj = new Date(r.dateProcessed);
      const dateFormatted = isNaN(dateObj.getTime())
        ? 'Hoy'
        : dateObj.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
      const issuedFormatted = isNaN(dateObj.getTime())
        ? 'Hoy, 14:00 PM'
        : `${dateFormatted}, ${dateObj.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;

      return {
        id: r.id,
        title: r.examTitle || 'Examen Clínico Preventivo',
        specialty: r.specialty || 'Laboratorio Clínico Especializado',
        category: 'Laboratorio' as const,
        status: r.aiAnalysis ? ('Interpretado con IA' as const) : ('Completado' as const),
        badgeClass: r.aiAnalysis ? ('badge-purple' as const) : ('badge-success' as const),
        appointmentDate: dateFormatted,
        appointmentTime: '08:30 AM - 09:15 AM',
        issuedDate: issuedFormatted,
        duration: '45 minutos',
        doctorName: r.doctorSignature || 'Dr. Carlos Mendoza S.',
        doctorSpecialty: 'Bioquímico Clínico & Patólogo',
        doctorReg: 'MSP-092810-LAB',
        facilityName: r.laboratoryName || 'Laboratorio CheckUp+ Central',
        roomNumber: 'Módulo Analítico 104',
        technicalSummary: r.technicalSummary || `Evaluación de tamizaje clínico para ${r.examTitle}. Parámetros procesados mediante tecnología automatizada de alta precisión.`,
        icd10Code: r.icd10Code || 'Z01.7 - Examen de laboratorio clínico general',
        vitalSigns: {
          bloodPressure: r.vitalSigns?.bloodPressure || '120 / 80 mmHg',
          heartRate: r.vitalSigns?.heartRate || '72 lpm (Normocardia)',
          temperature: r.vitalSigns?.temperature || '36.5 °C',
          oxygenSaturation: r.vitalSigns?.oxygenSaturation || '98% SpO2 (Aire ambiente)',
          respiratoryRate: r.vitalSigns?.respiratoryRate || '16 rpm'
        },
        labBiomarkers: (r.parameters && r.parameters.length > 0) ? r.parameters.map(p => ({
          name: p.name,
          value: p.rawResult || `${p.numericValue ?? 0}`,
          unit: p.unit || '',
          referenceRange: p.referenceRange || 'Normal',
          status: (p.status?.toLowerCase() === 'normal' || p.status?.toLowerCase() === 'optimal') ? ('optimal' as const) : ('normal' as const),
          notes: p.aiExplanation || p.notes || 'Parámetro dentro de rango fisiológico esperado'
        })) : [
          { name: 'Glucosa en ayunas', value: '89', unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'optimal' as const, notes: 'Nivel óptimo' },
          { name: 'Colesterol Total', value: '178', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'optimal' as const, notes: 'Perfil adecuado' },
          { name: 'Hemoglobina', value: '14.5', unit: 'g/dL', referenceRange: '13.5 - 17.5 g/dL', status: 'optimal' as const, notes: 'Sin anemia' }
        ],
        technicalFindings: (r.technicalFindings && r.technicalFindings.length > 0) ? r.technicalFindings : [
          'Calibración y controles de calidad analítica verificados y validados.',
          'Ausencia de reactividad infecciosa o marcadores inflamatorios agudos.',
          'Muestra biológica conservada con integridad celular óptima.'
        ],
        recommendations: (r.recommendations && r.recommendations.length > 0) ? r.recommendations : [
          'Mantener régimen de hidratación diaria y nutrición balanceada.',
          'Control preventivo semestral en centro aliado CheckUp+.'
        ],
        prescriptions: (r.prescriptions as any[])?.length ? (r.prescriptions as any) : [],
        dietAndLifestyle: (r.dietAndLifestyle && r.dietAndLifestyle.length > 0) ? r.dietAndLifestyle : [
          'Dieta rica en fibra, vegetales frescos y ácidos grasos saludables.',
          'Actividad física moderada de 30 minutos al día.'
        ],
        followUpInstructions: r.followUpInstructions || 'Chequeo preventivo recomendado en 6 meses o ante cualquier variación de salud.',
        warningSignals: (r.warningSignals && r.warningSignals.length > 0) ? r.warningSignals : [
          'Aparición de fiebre alta repentina o fatiga desacostumbrada.',
          'Dolor corporal agudo no asociado a esfuerzo.'
        ],
        nextAppointment: r.nextAppointment || {
          suggestedDate: '24 de Noviembre de 2026',
          suggestedTime: '09:00 AM',
          specialty: 'Medicina Preventiva',
          doctor: 'Dr. Carlos Mendoza',
          facility: r.laboratoryName || 'Laboratorio CheckUp+ Central',
          status: 'Sugerida' as const,
          notes: 'Control semestral de rutina'
        },
        aiSummary: {
          plainLanguageExplanation: r.aiAnalysis?.summary || `Tus análisis de ${r.examTitle} indican que todos tus parámetros se encuentran en niveles saludables y normales.`,
          keyTakeaways: r.aiAnalysis?.simplifiedKeyPoints || ['Resultados normales', 'Sin señales de alarma', 'Salud preventiva óptima'],
          positiveAspects: r.aiAnalysis?.positiveAspects || ['Valores dentro de rangos esperados', 'Sin inflamación detectada'],
          actionPoints: r.aiAnalysis?.actionPoints || ['Guardar este informe en tu historial CheckUp+'],
          faq: (r.aiAnalysis?.faq as any[]) || [
            { question: '¿Qué significan mis resultados?', answer: 'Indican que tus biomarcadores están en niveles fisiológicos adecuados y no requieren tratamiento de urgencia.' }
          ]
        }
      };
    });

    // Merge DB results (first) with default results, avoiding duplicates by id
    const dbIds = new Set(mappedDb.map(m => m.id));
    const uniqueDefaults = this.appointmentResults.filter(def => !dbIds.has(def.id));
    return [...mappedDb, ...uniqueDefaults];
  }

  // Helper para filtrar lista
  get filteredResults(): MedicalAppointmentResult[] {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();

    return this.allResults.filter(res => {
      const matchCat = cat === 'Todas' || res.category === cat;
      const matchQuery = !query || 
        res.title.toLowerCase().includes(query) ||
        res.doctorName.toLowerCase().includes(query) ||
        res.specialty.toLowerCase().includes(query) ||
        res.icd10Code.toLowerCase().includes(query) ||
        res.appointmentDate.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }

  // Resultado seleccionado en vista detallada
  get selectedResult(): MedicalAppointmentResult | null {
    const id = this.selectedResultId();
    if (!id) return null;
    return this.allResults.find(r => r.id === id) || null;
  }

  // Métodos de navegación
  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openResultDetail(id: string): void {
    this.selectedResultId.set(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeDetail(): void {
    this.selectedResultId.set(null);
  }

  // AI Modal Controls
  async openAiModal(): Promise<void> {
    const current = this.selectedResult;
    this.showAiModal.set(true);
    this.aiTab.set('explicacion');

    if (current && (!current.aiSummary.positiveAspects || current.aiSummary.positiveAspects.length === 0)) {
      try {
        await this.resultsService.translateResult(current.id);
      } catch (e) {
        console.error('Error traduciendo resultado con IA:', e);
      }
    }
  }

  closeAiModal(): void {
    this.showAiModal.set(false);
    this.stopSpeakingAi();
  }

  setAiTab(tab: 'explicacion' | 'puntos' | 'faq'): void {
    this.aiTab.set(tab);
  }

  toggleSpeechAi(): void {
    if (this.isSpeakingAi()) {
      this.stopSpeakingAi();
    } else {
      this.startSpeakingAi();
    }
  }

  startSpeakingAi(): void {
    const current = this.selectedResult;
    if (!current) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToRead = `Resumen con Inteligencia Artificial CheckUp: ${current.aiSummary.plainLanguageExplanation}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      
      utterance.onend = () => this.isSpeakingAi.set(false);
      utterance.onerror = () => this.isSpeakingAi.set(false);

      this.isSpeakingAi.set(true);
      window.speechSynthesis.speak(utterance);
    } else {
      this.showToast('El asistente de voz no está soportado en este navegador.');
    }
  }

  stopSpeakingAi(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingAi.set(false);
  }

  // PDF Generator & Downloader
  downloadPdfResult(): void {
    const res = this.selectedResult;
    if (!res) return;

    this.showToast('Generando informe médico oficial en PDF...');

    setTimeout(() => {
      // 1. Crear ventana de impresión formateada con plantilla médica oficial
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Informe_Medico_${res.title.replace(/\s+/g, '_')}</title>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 32px; max-width: 800px; margin: auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #00c885; padding-bottom: 16px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: 900; color: #00c885; }
              .doc-title { font-size: 14px; color: #64748b; font-weight: 700; }
              .section { margin-bottom: 20px; }
              .sec-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #00a870; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; }
              .badge-optimal { background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
              .badge-normal { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
              .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; font-size: 11px; color: #64748b; text-align: center; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">CheckUp+ Salud</div>
                <div class="doc-title">EXPEDIENTE CLÍNICO DIGITAL CERTIFICADO</div>
              </div>
              <div style="text-align: right; font-size: 12px;">
                <strong>Fecha Emisión:</strong> ${res.issuedDate}<br>
                <strong>ID Resultado:</strong> ${res.id}
              </div>
            </div>

            <div class="section">
              <div class="sec-title">1. Datos del Paciente</div>
              <div class="grid-2">
                <div><strong>Nombre:</strong> ${this.patient.fullName}</div>
                <div><strong>Cédula / ID:</strong> ${this.patient.cedula} (${this.patient.patientId})</div>
                <div><strong>Edad / Sexo:</strong> ${this.patient.age} años | ${this.patient.gender}</div>
                <div><strong>Tipo de Sangre:</strong> ${this.patient.bloodType}</div>
                <div><strong>Alergias:</strong> ${this.patient.allergies.join(', ')}</div>
                <div><strong>Seguro:</strong> ${this.patient.insurance}</div>
              </div>
            </div>

            <div class="section">
              <div class="sec-title">2. Detalles de la Atención</div>
              <div class="grid-2">
                <div><strong>Examen:</strong> ${res.title}</div>
                <div><strong>Especialidad:</strong> ${res.specialty}</div>
                <div><strong>Médico Tratante:</strong> ${res.doctorName} (${res.doctorReg})</div>
                <div><strong>Institución:</strong> ${res.facilityName}</div>
                <div><strong>CIE-10:</strong> ${res.icd10Code}</div>
                <div><strong>Fecha Cita:</strong> ${res.appointmentDate} (${res.appointmentTime})</div>
              </div>
            </div>

            <div class="section">
              <div class="sec-title">3. Parámetros y Biomarcadores de Laboratorio</div>
              <table>
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th>Resultado</th>
                    <th>Rango de Referencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${res.labBiomarkers.map(b => `
                    <tr>
                      <td><strong>${b.name}</strong><br><small style="color:#64748b">${b.notes || ''}</small></td>
                      <td><strong>${b.value} ${b.unit}</strong></td>
                      <td>${b.referenceRange}</td>
                      <td><span class="badge-${b.status}">${b.status.toUpperCase()}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="sec-title">4. Resumen Clínico & Hallazgos</div>
              <p style="font-size: 13px; line-height: 1.5;">${res.technicalSummary}</p>
              <ul style="font-size: 12px; margin-top: 6px;">
                ${res.technicalFindings.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>

            <div class="section">
              <div class="sec-title">5. Recomendaciones & Plan de Seguimiento</div>
              <ul style="font-size: 12px;">
                ${res.recommendations.map(r => `<li>${r}</li>`).join('')}
              </ul>
              <p style="font-size: 12px;"><strong>Instrucciones de seguimiento:</strong> ${res.followUpInstructions}</p>
              <p style="font-size: 12px;"><strong>Próxima cita sugerida:</strong> ${res.nextAppointment.suggestedDate} a las ${res.nextAppointment.suggestedTime} (${res.nextAppointment.doctor})</p>
            </div>

            <div class="footer">
              Este documento médico ha sido emitido y validado digitalmente por el sistema CheckUp+ Salud Integral.<br>
              Validez oficial para trámites clínicos y seguimiento médico preventivo.
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }

      this.showToast('¡Documento médico PDF listo para guardar o imprimir!');
    }, 600);
  }

  // Agendar Próxima Cita Directa
  bookNextAppointment(): void {
    const res = this.selectedResult;
    if (!res) return;
    this.showToast(`¡Solicitud enviada para agendar la próxima cita del ${res.nextAppointment.suggestedDate}!`);
  }

  // Helper de notificación
  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
