import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsRange, AnalyticsSummary } from '../models/analytics.models';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly http = inject(HttpClient);
  private readonly analyticsBase = `${environment.apiBaseUrl}/analytics`;

  getSummary(range: AnalyticsRange): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.analyticsBase}/summary`, { params: { range } });
  }
}
