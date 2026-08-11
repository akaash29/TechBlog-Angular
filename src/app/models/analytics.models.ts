export interface CountryVisitCount {
  country: string;
  count: number;
}

export interface DailyVisitCount {
  date: string;
  count: number;
}

export interface PageVisitCount {
  path: string;
  count: number;
}

export interface DeviceVisitCount {
  device: string;
  count: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  activeNow: number;
  averageSessionDurationSeconds: number;
  visitsByCountry: CountryVisitCount[];
  visitsOverTime: DailyVisitCount[];
  topPages: PageVisitCount[];
  visitsByDevice: DeviceVisitCount[];
}

export type AnalyticsRange = 'day' | 'week' | 'month' | 'year';
