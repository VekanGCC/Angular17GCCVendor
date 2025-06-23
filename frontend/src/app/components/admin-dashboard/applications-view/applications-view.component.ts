import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../models/application.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './applications-view.component.html',
  styleUrls: ['./applications-view.component.scss']
})
export class ApplicationsViewComponent {
  @Input() applications: Application[] = [];
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() pageChange = new EventEmitter<number>();

  constructor() {}

  getApplicationTitle(application: any): string {
    if (this.isObject(application.resource)) {
      return application.resource.name || 'Resource';
    }
    if (this.isObject(application.requirement)) {
      return application.requirement.title || 'Requirement';
    }
    return 'Unknown';
  }

  getApplicationCreator(application: any): string {
    if (this.isObject(application.createdBy)) {
      const firstName = application.createdBy.firstName || '';
      const lastName = application.createdBy.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    }
    return 'User';
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object';
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 