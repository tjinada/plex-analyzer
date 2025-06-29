import { Routes } from '@angular/router';
import { SetupWizardComponent } from './features/setup/components/setup-wizard/setup-wizard.component';
import { DashboardComponent } from './features/dashboard/components/dashboard/dashboard.component';
import { AnalyzerPageComponent } from './features/analyzer/components/analyzer-page/analyzer-page.component';
import { configGuard } from './core/guards/config.guard';
import { redirectGuard } from './core/guards/redirect.guard';
import { setupGuard } from './core/guards/setup.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [redirectGuard],
    children: []
  },
  {
    path: 'setup',
    component: SetupWizardComponent,
    canActivate: [setupGuard],
    title: 'Setup - Plex Analyzer'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [configGuard],
    title: 'Dashboard - Plex Analyzer'
  },
  {
    path: 'analyzer/:libraryId',
    component: AnalyzerPageComponent,
    canActivate: [configGuard],
    title: 'Library Analyzer - Plex Analyzer'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
