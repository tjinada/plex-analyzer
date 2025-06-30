import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  icon?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-header" [class]="data.type || 'info'">
        <mat-icon *ngIf="data.icon" class="dialog-icon">{{ data.icon }}</mat-icon>
        <mat-icon *ngIf="!data.icon && data.type === 'warning'" class="dialog-icon">warning</mat-icon>
        <mat-icon *ngIf="!data.icon && data.type === 'danger'" class="dialog-icon">error</mat-icon>
        <mat-icon *ngIf="!data.icon && data.type === 'success'" class="dialog-icon">check_circle</mat-icon>
        <mat-icon *ngIf="!data.icon && data.type === 'info'" class="dialog-icon">info</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <p [innerHTML]="data.message"></p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button 
                (click)="onCancel()" 
                class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button 
                [color]="getConfirmButtonColor()"
                (click)="onConfirm()" 
                class="confirm-button">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 400px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px 0;
      margin-bottom: 8px;
    }

    .dialog-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .dialog-header.info .dialog-icon {
      color: #2196f3;
    }

    .dialog-header.warning .dialog-icon {
      color: #ff9800;
    }

    .dialog-header.danger .dialog-icon {
      color: #f44336;
    }

    .dialog-header.success .dialog-icon {
      color: #4caf50;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .dialog-content {
      padding: 8px 24px 16px;
      color: #666;
      line-height: 1.5;
    }

    .dialog-content p {
      margin: 0;
    }

    .dialog-actions {
      padding: 8px 24px 16px;
      gap: 8px;
    }

    .cancel-button {
      color: #666;
    }

    .confirm-button {
      min-width: 100px;
    }

    @media (max-width: 600px) {
      .confirmation-dialog {
        min-width: 300px;
      }
      
      .dialog-actions {
        flex-direction: column-reverse;
        align-items: stretch;
      }
      
      .confirm-button,
      .cancel-button {
        width: 100%;
        margin: 4px 0;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getConfirmButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'warning':
        return 'accent';
      case 'success':
        return 'primary';
      default:
        return 'primary';
    }
  }
}