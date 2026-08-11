import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { InsightsService } from '../../app/services/insights.service';
import { SeoHealthReport, SeoHealthService } from '../../app/services/seo-health.service';
import { AnalyticsRange, AnalyticsSummary, DailyVisitCount } from '../../app/models/analytics.models';

const RANGES: ReadonlyArray<{ value: AnalyticsRange; label: string }> = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-insights',
  imports: [],
  templateUrl: './insights.html',
  styleUrl: './insights.css',
})
export class Insights implements OnInit, OnDestroy {
  private readonly insightsService = inject(InsightsService);
  private readonly seoHealthService = inject(SeoHealthService);

  protected readonly ranges = RANGES;
  protected readonly selectedRange = signal<AnalyticsRange>('week');
  protected readonly loading = signal(false);
  protected readonly summary = signal<AnalyticsSummary | null>(null);
  protected readonly seoReport = signal<SeoHealthReport | null>(null);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSummary(false);
    void this.loadSeoHealth();

    // "Active now" is only meaningful if it stays roughly live — cheap
    // polling instead of standing up a websocket for this one number.
    this.refreshTimer = setInterval(() => this.loadSummary(true), AUTO_REFRESH_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
    }
  }

  protected selectRange(range: AnalyticsRange): void {
    if (range === this.selectedRange()) return;
    this.selectedRange.set(range);
    this.loadSummary(false);
  }

  /** Template expressions can't use arrow functions or the global Math
   *  object, so both the "max of a series" and per-bar height math live
   *  here as plain methods instead of inline template expressions. */
  protected maxOf(items: ReadonlyArray<{ count: number }>): number {
    let max = 1;
    for (const item of items) {
      if (item.count > max) max = item.count;
    }
    return max;
  }

  protected sparkBarHeightPercent(point: DailyVisitCount, series: readonly DailyVisitCount[]): number {
    return Math.max(6, (point.count / this.maxOf(series)) * 100);
  }

  protected barWidthPercent(count: number, series: ReadonlyArray<{ count: number }>): number {
    return (count / this.maxOf(series)) * 100;
  }

  protected formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  protected formatDay(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  private loadSummary(silent: boolean): void {
    if (!silent) this.loading.set(true);

    this.insightsService.getSummary(this.selectedRange()).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load analytics summary:', err);
        this.loading.set(false);
      },
    });
  }

  private async loadSeoHealth(): Promise<void> {
    try {
      this.seoReport.set(await this.seoHealthService.run());
    } catch (err) {
      console.error('Failed to run SEO health checks:', err);
    }
  }
}
