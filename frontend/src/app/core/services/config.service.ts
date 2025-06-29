import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ServiceConfig {
  url: string;
  apiKey?: string;
  token?: string;
  enabled?: boolean;
}

export interface AppConfig {
  plex: ServiceConfig;
  tautulli?: ServiceConfig;
  radarr?: ServiceConfig;
  sonarr?: ServiceConfig;
}

export interface ConfigStatus {
  isConfigured: boolean;
  services: {
    [key: string]: {
      configured: boolean;
      enabled?: boolean;
      url?: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configStatusSubject = new BehaviorSubject<ConfigStatus | null>(null);
  public configStatus$ = this.configStatusSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadConfigStatus();
  }

  /**
   * Load current configuration status
   */
  loadConfigStatus(): Observable<ConfigStatus> {
    return this.apiService.get<any>('/config').pipe(
      map(response => response.data),
      tap(status => this.configStatusSubject.next(status))
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: AppConfig): Observable<any> {
    return this.apiService.post('/config', config).pipe(
      tap(() => this.loadConfigStatus().subscribe())
    );
  }

  /**
   * Test service connections
   */
  testConnections(): Observable<any> {
    return this.apiService.post('/config/test', {});
  }

  /**
   * Test connection without saving configuration
   */
  testConnectionOnly(config: any): Observable<any> {
    return this.apiService.post('/config/test-only', config);
  }

  /**
   * Reset configuration
   */
  resetConfig(): Observable<any> {
    return this.apiService.delete('/config').pipe(
      tap(() => this.loadConfigStatus().subscribe())
    );
  }

  /**
   * Check if system is configured
   */
  isConfigured(): boolean {
    const status = this.configStatusSubject.value;
    return status?.isConfigured || false;
  }

  /**
   * Get current config status
   */
  getCurrentStatus(): ConfigStatus | null {
    return this.configStatusSubject.value;
  }
}