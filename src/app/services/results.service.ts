import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClinicalResult, ExamCategory, AIInterpretation } from '../models/checkup.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/results`;

  clinicalResults = signal<ClinicalResult[]>([]);

  constructor() {
    this.fetchResults();
  }

  fetchResults(category?: ExamCategory | 'all'): void {
    let url = this.apiUrl;
    if (category && category !== 'all') {
      url += `?category=${category}`;
    }

    this.http.get<{ success: boolean; results: ClinicalResult[] }>(url).subscribe({
      next: (res) => {
        if (res.success && res.results) {
          this.clinicalResults.set(res.results);
        }
      },
      error: () => {}
    });
  }

  getResultsByCategory(category?: ExamCategory | 'all'): ClinicalResult[] {
    if (!category || category === 'all') {
      return this.clinicalResults();
    }
    return this.clinicalResults().filter(r => r.category === category);
  }

  translateResult(resultId: string): Promise<ClinicalResult | undefined> {
    return new Promise((resolve) => {
      this.http.post<{ success: boolean; aiAnalysis: AIInterpretation }>(`${this.apiUrl}/${resultId}/translate`, {}).subscribe({
        next: (res) => {
          if (res.success && res.aiAnalysis) {
            const list = this.clinicalResults().map(r => {
              if (r.id === resultId) {
                return { ...r, aiAnalysis: res.aiAnalysis };
              }
              return r;
            });
            this.clinicalResults.set(list);
            resolve(list.find(r => r.id === resultId));
          }
        },
        error: () => {
          const item = this.clinicalResults().find(r => r.id === resultId);
          resolve(item);
        }
      });
    });
  }
}
