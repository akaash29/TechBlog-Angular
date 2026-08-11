import { Injectable } from '@angular/core';

export interface SeoCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface SeoHealthReport {
  score: number;
  checks: SeoCheck[];
}

/** A small set of real, self-computed on-page SEO checks — no external
 *  service involved. Deliberately doesn't attempt "search engine position"
 *  or anything else that would need Search Console/SEMrush-style
 *  credentials this app doesn't have. */
@Injectable({ providedIn: 'root' })
export class SeoHealthService {
  async run(): Promise<SeoHealthReport> {
    const checks: SeoCheck[] = [
      this.checkHttps(),
      this.checkViewport(),
      this.checkMetaDescription(),
      this.checkTitle(),
      await this.checkFileReachable('/robots.txt', 'robots.txt present'),
      await this.checkFileReachable('/sitemap.xml', 'sitemap.xml present'),
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return { score, checks };
  }

  private checkHttps(): SeoCheck {
    const passed = location.protocol === 'https:';
    return {
      label: 'HTTPS enabled',
      passed,
      detail: passed
        ? 'Served over HTTPS.'
        : 'Not served over HTTPS — search engines rank and trust insecure sites lower.',
    };
  }

  private checkViewport(): SeoCheck {
    const passed = !!document.querySelector('meta[name="viewport"]');
    return {
      label: 'Mobile viewport tag',
      passed,
      detail: passed
        ? 'Responsive viewport meta tag present.'
        : 'Missing <meta name="viewport"> — hurts mobile rendering and mobile-first indexing.',
    };
  }

  private checkMetaDescription(): SeoCheck {
    const el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const content = el?.content?.trim() ?? '';
    return {
      label: 'Meta description',
      passed: content.length > 0,
      detail: content ? `"${content.slice(0, 90)}${content.length > 90 ? '…' : ''}"` : 'No meta description found.',
    };
  }

  private checkTitle(): SeoCheck {
    const title = document.title?.trim() ?? '';
    return {
      label: 'Page title',
      passed: title.length > 0,
      detail: title ? `"${title}"` : 'No <title> set.',
    };
  }

  private async checkFileReachable(path: string, label: string): Promise<SeoCheck> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      return {
        label,
        passed: response.ok,
        detail: response.ok ? `Reachable at ${path}.` : `${path} returned HTTP ${response.status}.`,
      };
    } catch {
      return { label, passed: false, detail: `Could not reach ${path}.` };
    }
  }
}
