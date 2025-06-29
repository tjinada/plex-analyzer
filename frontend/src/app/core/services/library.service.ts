import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Library, GlobalStats } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  
  constructor(private apiService: ApiService) {}

  /**
   * Get all libraries
   */
  getLibraries(): Observable<Library[]> {
    return this.apiService.get<any>('/libraries').pipe(
      map(response => response.data)
    );
  }

  /**
   * Get specific library details
   */
  getLibrary(libraryId: string): Observable<Library> {
    return this.apiService.get<any>(`/libraries/${libraryId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): Observable<GlobalStats> {
    return this.apiService.get<any>('/statistics').pipe(
      map(response => response.data)
    );
  }

  /**
   * Refresh library cache
   */
  refreshLibrary(libraryId: string): Observable<any> {
    return this.apiService.get<any>(`/libraries/${libraryId}/refresh`);
  }

  /**
   * Refresh all statistics
   */
  refreshAllStats(): Observable<any> {
    return this.apiService.post<any>('/statistics/refresh', {});
  }
}