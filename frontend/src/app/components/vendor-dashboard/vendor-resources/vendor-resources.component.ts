import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../models/resource.model';
import { PaginationState, PaginationParams } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-vendor-resources',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './vendor-resources.component.html',
  styleUrls: ['./vendor-resources.component.scss']
})
export class VendorResourcesComponent {
  @Input() resources: Resource[] = [];
  @Input() isLoading = false;
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };
  
  @Output() openResourceModal = new EventEmitter<void>();
  @Output() editResource = new EventEmitter<Resource>();
  @Output() toggleResourceStatus = new EventEmitter<{resourceId: string, currentStatus: 'active' | 'inactive'}>();
  @Output() pageChange = new EventEmitter<number>();

  constructor() {}

  ngOnChanges(): void {
    console.log('🔧 VendorResourcesComponent: ngOnChanges called');
    console.log('🔧 VendorResourcesComponent: Resources updated:', this.resources);
    console.log('🔧 VendorResourcesComponent: Pagination state:', this.paginationState);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  isResourceActive(resource: Resource): boolean {
    return resource.status?.toLowerCase() === 'active';
  }

  getToggleButtonText(resource: Resource): string {
    return this.isResourceActive(resource) ? 'Deactivate' : 'Activate';
  }

  getToggleButtonClass(resource: Resource): string {
    if (this.isResourceActive(resource)) {
      return 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-300';
    } else {
      return 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300';
    }
  }

  onToggleResourceStatus(resource: Resource): void {
    const newStatus = this.isResourceActive(resource) ? 'inactive' : 'active';
    this.toggleResourceStatus.emit({ resourceId: resource._id, currentStatus: newStatus });
  }

  getStatusClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'check-circle';
      case 'inactive':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  formatStatus(status: string | undefined): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  getAvailabilityClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailabilityIcon(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'check-circle';
      case 'busy':
        return 'clock';
      case 'unavailable':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  formatAvailability(status: string | undefined): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  onOpenResourceModal(): void {
    this.openResourceModal.emit();
  }

  onEditResource(resource: Resource): void {
    this.editResource.emit(resource);
  }

  trackById(index: number, item: Resource): string {
    return item._id || `resource-${index}`;
  }
} 