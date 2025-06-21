import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Application History</h3>
          <button 
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600">
            <img src="assets/icons/lucide/lucide/x.svg" alt="x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div *ngIf="isLoading" class="flex items-center justify-center py-8">
            <img src="assets/icons/lucide/lucide/loader.svg" alt="loader-2" class="w-6 h-6 animate-spin text-blue-600" />
            <span class="ml-2 text-gray-600">Loading history...</span>
          </div>

          <div *ngIf="!isLoading && history.length === 0" class="text-center py-8">
            <img src="assets/icons/lucide/lucide/history.svg" alt="history" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500">No history available for this application.</p>
          </div>

          <div *ngIf="!isLoading && history.length > 0" class="space-y-4">
            <div 
              *ngFor="let entry of history; trackBy: trackById" 
              class="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getStatusClass(entry.status)">
                      {{formatStatus(entry.status)}}
                    </span>
                    <span *ngIf="entry.previousStatus" class="text-gray-500 text-xs">
                      from {{formatStatus(entry.previousStatus)}}
                    </span>
                  </div>
                  <p *ngIf="entry.notes" class="text-sm text-gray-700 mb-2">{{entry.notes}}</p>
                  <div class="flex items-center text-xs text-gray-500">
                    <img src="assets/icons/lucide/lucide/user.svg" alt="user" class="w-3 h-3 mr-1" />
                    <span>{{entry.updatedBy.firstName}} {{entry.updatedBy.lastName}}</span>
                    <span class="mx-2">•</span>
                    <img src="assets/icons/lucide/lucide/clock.svg" alt="clock" class="w-3 h-3 mr-1" />
                    <span>{{entry.createdAt | date:'medium'}}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApplicationHistoryModalComponent implements OnInit {
  @Input() applicationId: string = '';
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() history: ApplicationHistoryEntry[] = [];
  @Output() close = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  onClose(): void {
    this.close.emit();
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

  trackById(index: number, item: ApplicationHistoryEntry): string {
    return item._id || `history-${index}`;
  }
} 