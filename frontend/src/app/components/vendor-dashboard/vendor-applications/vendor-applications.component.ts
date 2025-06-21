import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../models/application.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-vendor-applications',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './vendor-applications.component.html',
  styleUrls: ['./vendor-applications.component.scss']
})
export class VendorApplicationsComponent {
  @Input() applications: Application[] = [];
  @Input() isLoading = false;
  @Input() paginationState!: PaginationState;
  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string}>();
  @Output() viewApplicationHistory = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();

  constructor() {}

  ngOnChanges(): void {
    console.log('🔧 VendorApplicationsComponent: ngOnChanges called');
    console.log('🔧 VendorApplicationsComponent: Applications updated:', this.applications);
  }

  getResourceName(app: Application): string {
    if (typeof app.resource === 'string') {
      return 'Unknown';
    }
    return app.resource?.name || 'Unknown';
  }

  getRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'string') {
      return 'Unknown';
    }
    return app.requirement?.title || 'Unknown';
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
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

  getAvailableStatusOptions(currentStatus: string): any[] {
    const status = currentStatus?.toLowerCase();
    
    // If status is applied, pending, shortlisted, or accepted - only show "Revoke Candidate"
    if (['applied', 'pending', 'shortlisted', 'accepted'].includes(status)) {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // If status is offer_created - show "Accept Offer" or "Reject Offer"
    if (status === 'offer_created') {
      return [
        { value: 'accepted', label: 'Accept Offer', color: 'bg-green-100 text-green-800' },
        { value: 'rejected', label: 'Reject Offer', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // If status is onboarded or did_not_join - no options
    if (['onboarded', 'did_not_join'].includes(status)) {
      return [];
    }
    
    // Default - no options
    return [];
  }

  hasStatusOptions(status: string): boolean {
    return this.getAvailableStatusOptions(status).length > 0;
  }

  onStatusChange(applicationId: string, newStatus: string): void {
    this.updateApplicationStatus.emit({ applicationId, status: newStatus });
  }

  onViewHistory(applicationId: string): void {
    this.viewApplicationHistory.emit(applicationId);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  trackById(index: number, item: Application): string {
    return item._id || `application-${index}`;
  }
} 