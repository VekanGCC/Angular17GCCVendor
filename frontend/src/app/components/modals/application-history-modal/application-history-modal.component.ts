import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ApplicationHistoryEntry {
  _id: string;
  application: string;
  previousStatus?: string;
  status: string;
  notes?: string;
  decisionReason?: {
    category?: string;
    details?: string;
    rating?: number;
    criteria?: string[];
    notes?: string;
  };
  notifyCandidate?: boolean;
  notifyClient?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface ApplicationDetails {
  _id: string;
  status: string;
  requirement?: {
    _id: string;
    title: string;
    status: string;
    priority: string;
  };
  resource?: {
    _id: string;
    name: string;
    status: string;
    category: string;
  };
  createdBy?: {
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
      align-items: flex-start;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-content {
      flex: 1;
      margin-right: 16px;
    }

    .modal-title {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .application-details {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 12px;
      border: 1px solid #e5e7eb;
    }

    .detail-row {
      display: flex;
      gap: 24px;
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
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

    .status-change-indicator {
      display: flex;
      align-items: center;
      color: #6b7280;
      font-size: 0.75rem;
      margin-left: 8px;
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
      gap: 16px;
    }

    .history-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .history-field {
      margin-bottom: 8px;
    }

    .field-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
      display: block;
    }

    .field-value {
      font-size: 0.875rem;
      color: #111827;
      margin: 0;
      line-height: 1.4;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star-filled {
      color: #fbbf24;
      font-size: 1rem;
    }

    .star-empty {
      color: #d1d5db;
      font-size: 1rem;
    }

    .rating-text {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .criteria-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .criteria-tag {
      background-color: #e5e7eb;
      color: #374151;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .notification-status {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .notification-label {
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .notification-sent {
      color: #059669;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .notification-not-sent {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .follow-up-required {
      color: #dc2626;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .follow-up-not-required {
      color: #059669;
      font-weight: 500;
      font-size: 0.875rem;
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
  @Input() applicationDetails?: ApplicationDetails;
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('🔧 ApplicationHistoryModal: ngOnInit called');
    console.log('🔧 ApplicationHistoryModal: Initial state:', {
      applicationId: this.applicationId,
      isVisible: this.isVisible,
      isLoading: this.isLoading,
      history: this.history
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ApplicationHistoryModal: ngOnChanges called with changes:', changes);
    
    // Force change detection for all input changes
    if (changes['isLoading'] || changes['history'] || changes['applicationId'] || changes['isVisible']) {
      console.log('🔧 ApplicationHistoryModal: Current state after changes:', {
        applicationId: this.applicationId,
        isVisible: this.isVisible,
        isLoading: this.isLoading,
        history: this.history,
        historyLength: this.history?.length
      });
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  handleBackdropClick(event: MouseEvent): void {
    console.log('🔧 ApplicationHistoryModal: Backdrop clicked');
    if (event.target === event.currentTarget) {
      console.log('🔧 ApplicationHistoryModal: Emitting close event from backdrop click');
      this.close.emit();
      this.cdr.detectChanges();
    }
  }

  onClose(): void {
    console.log('🔧 ApplicationHistoryModal: onClose called, isLoading =', this.isLoading);
    if (!this.isLoading) {
      console.log('🔧 ApplicationHistoryModal: Emitting close event from onClose');
      this.close.emit();
      this.cdr.detectChanges();
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
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  formatDecisionCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'technical_skills': 'Technical Skills',
      'experience': 'Experience',
      'rate': 'Rate',
      'availability': 'Availability',
      'cultural_fit': 'Cultural Fit',
      'timeline': 'Timeline',
      'better_opportunity': 'Better Opportunity',
      'resource_unavailable': 'Resource Unavailable',
      'other': 'Other'
    };
    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDecisionCriteria(criterion: string): string {
    const criteriaMap: { [key: string]: string } = {
      'technical_skills': 'Technical Skills',
      'experience_level': 'Experience Level',
      'rate_alignment': 'Rate Alignment',
      'availability': 'Availability',
      'cultural_fit': 'Cultural Fit',
      'communication': 'Communication',
      'portfolio': 'Portfolio',
      'references': 'References',
      'certifications': 'Certifications',
      'other': 'Other'
    };
    return criteriaMap[criterion] || criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackByHistoryItem(index: number, item: any): any {
    return item._id || index;
  }

  closeModal(): void {
    console.log('🔧 ApplicationHistoryModal: closeModal called');
    this.close.emit();
    this.cdr.detectChanges();
  }

  // Helper method to check if modal should show content
  shouldShowContent(): boolean {
    const result = this.isVisible && !this.isLoading;
    console.log('🔧 ApplicationHistoryModal: shouldShowContent =', result, {
      isVisible: this.isVisible,
      isLoading: this.isLoading
    });
    return result;
  }

  // Helper method to check if we have history data
  hasHistoryData(): boolean {
    const result = this.history && this.history.length > 0;
    console.log('🔧 ApplicationHistoryModal: hasHistoryData =', result, {
      history: this.history,
      historyLength: this.history?.length
    });
    return result;
  }

  // Debug method to log current state
  logCurrentState(): void {
    console.log('🔧 ApplicationHistoryModal: Current state:', {
      applicationId: this.applicationId,
      isVisible: this.isVisible,
      isLoading: this.isLoading,
      history: this.history,
      historyLength: this.history?.length,
      applicationDetails: this.applicationDetails
    });
  }
} 