import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ApplicationHistoryEntry {
  _id: string;
  application: string;
  previousStatus?: string;
  status: string;
  notes?: string;
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-application-history-modal',
  templateUrl: './application-history-modal.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #6b7280;
      transition: color 0.2s;
    }

    .close-button:hover {
      color: #374151;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .no-data-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .no-data-icon {
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .no-data-title {
      margin: 0 0 8px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .no-data-message {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .history-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background-color: #fafafa;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-approved {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-rejected {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .status-applied {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-unknown {
      background-color: #f3f4f6;
      color: #374151;
    }

    .history-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .history-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .history-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .field-value {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-secondary {
      background-color: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background-color: #e5e7eb;
    }

    .debug-info {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: normal;
    }
  `]
})
export class ApplicationHistoryModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() applicationId: string = '';
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() history: ApplicationHistoryEntry[] = [];
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Force change detection for all input changes
    if (changes['isLoading'] || changes['history'] || changes['applicationId'] || changes['isVisible']) {
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    if (!this.isLoading) {
      this.close.emit();
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_created':
        return 'bg-indigo-100 text-indigo-800';
      case 'onboarded':
        return 'bg-teal-100 text-teal-800';
      case 'did_not_join':
        return 'bg-orange-100 text-orange-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackByHistoryItem(index: number, item: any): any {
    return item._id || `history-${index}`;
  }

  closeModal(): void {
    // Emit close event (you'll need to add Output if you want to handle this)
  }

  // Helper method to check if modal should show content
  shouldShowContent(): boolean {
    const result = this.isVisible && !this.isLoading;
    return result;
  }

  // Helper method to check if we have history data
  hasHistoryData(): boolean {
    const result = this.history && this.history.length > 0;
    return result;
  }

  // Debug method to log current state
  logCurrentState(): void {
    // Implement debug logging if needed
  }
} 