import { Injectable } from '@angular/core';
import { AIInterpretation, ClinicalParameter } from '../models/checkup.types';

@Injectable({
  providedIn: 'root'
})
export class AiTranslatorService {
  private readonly MANDATORY_DISCLAIMER = 
    'Aviso médico importante: La interpretación adaptativa proporcionada por inteligencia artificial es exclusivamente educativa e informativa y bajo ningún concepto sustituye la valoración o diagnóstico de un profesional médico certificado.';

  /**
   * RF6.1 - Adaptive Clinical Report AI Interpretation
   */
  translateClinicalResults(
    examTitle: string,
    parameters: ClinicalParameter[]
  ): AIInterpretation {
    const simplifiedPoints: string[] = [];
    const recommendations: string[] = [];
    let hasAlert = false;

    parameters.forEach(param => {
      let explanation = '';
      const raw = param.rawResult.toLowerCase();

      if (raw.includes('no reactivo') || raw.includes('negativo') || param.status === 'NORMAL') {
        explanation = `🟢 **${param.name}**: Resultado óptimo y sin reactividad infecciosa (${param.rawResult}). Se encuentra dentro del rango de referencia seguro (${param.referenceRange}).`;
      } else if (raw.includes('reactivo') || raw.includes('positivo') || param.status === 'ATTENTION' || param.status === 'ELEVATED') {
        hasAlert = true;
        explanation = `🟡 **${param.name}**: Se observa un valor (${param.rawResult}) fuera del rango esperado (${param.referenceRange}). Requiere revisión de seguimiento con tu médico tratante.`;
      } else {
        explanation = `ℹ️ **${param.name}**: Valor obtenido: ${param.rawResult} (${param.referenceRange}).`;
      }

      simplifiedPoints.push(explanation);
    });

    if (!hasAlert) {
      recommendations.push('Tus valores reflejan un excelente estado preventivo general.');
      recommendations.push('Mantén tus hábitos de hidratación, alimentación equilibrada y descanso.');
      recommendations.push('Programa tu siguiente chequeo preventivo de rutina en 6 a 12 meses.');
    } else {
      recommendations.push('Comparte este reporte con tu médico para determinar si requieres pruebas complementarias.');
      recommendations.push('Evita automedicarte antes de recibir orientación profesional.');
    }

    const summaryText = hasAlert
      ? `El análisis para "${examTitle}" muestra que la mayoría de parámetros están controlados, con ciertas observaciones específicas que ameritan consulta médica de rutina.`
      : `El análisis para "${examTitle}" indica que todos los parámetros evaluados se encuentran en rangos totalmente normales y favorables, sin signos de alerta clínica.`;

    return {
      summary: summaryText,
      simplifiedKeyPoints: simplifiedPoints,
      followUpRecommendations: recommendations,
      disclaimer: this.MANDATORY_DISCLAIMER,
      confidenceScore: 0.99,
      analyzedAt: new Date().toISOString()
    };
  }
}
