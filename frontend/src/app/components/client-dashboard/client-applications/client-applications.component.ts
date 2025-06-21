import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Application } from '../../../models/application.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-client-applications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule],
  templateUrl: './client-applications.component.html',
  styleUrls: ['./client-applications.component.scss']
})
export class ClientApplicationsComponent implements OnInit, OnChanges {
  @Input() applications: Application[] = [];
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
  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string}>();
  @Output() viewApplicationHistory = new EventEmitter<string>();
  @Output() viewApplicationDetails = new EventEmitter<Application>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();

  availableStatuses = [
    { value: 'applied', label: 'Applied', color: 'bg-gray-100 text-gray-800' },
    { value: 'shortlisted', label: 'Shortlist', color: 'bg-blue-100 text-blue-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Reject', color: 'bg-red-100 text-red-800' },
    { value: 'accepted', label: 'Accept', color: 'bg-green-100 text-green-800' },
    { value: 'offer_created', label: 'Create Offer', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'onboarded', label: 'Onboarded', color: 'bg-teal-100 text-teal-800' },
    { value: 'did_not_join', label: 'Did Not Join', color: 'bg-orange-100 text-orange-800' }
  ];

  columnDefs: ColDef[] = [
    {
      headerName: 'Application',
      field: '_id',
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const app = params.data;
        const appId = app._id ? app._id.slice(-6) : 'N/A';
        return `<div class="text-sm font-medium text-gray-900">#${appId}</div>`;
      }
    },
    {
      headerName: 'Resource',
      field: 'resource.name',
      flex: 2,
      sortable: true,
      cellRenderer: (params: any) => {
        const resourceName = this.getResourceName(params.data);
        return `<div class="text-sm text-gray-900">${resourceName}</div>`;
      }
    },
    {
      headerName: 'Requirement',
      field: 'requirement.title',
      flex: 2,
      sortable: true,
      cellRenderer: (params: any) => {
        const requirementTitle = this.getRequirementTitle(params.data);
        return `<div class="text-sm text-gray-900">${requirementTitle}</div>`;
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1.5,
      sortable: true,
      cellRenderer: (params: any) => {
        const status = params.data.status || 'unknown';
        const statusClass = this.getStatusClass(status);
        const formattedStatus = this.formatStatus(status);
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${formattedStatus}</span>`;
      }
    },
    {
      headerName: 'Applied Date',
      field: 'createdAt',
      flex: 1.5,
      sortable: true,
      cellRenderer: (params: any) => {
        const date = new Date(params.value);
        return `<span class="text-sm text-gray-500">${date.toLocaleDateString()}</span>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const app = params.data;
        const availableStatuses = this.getAvailableStatuses(app.status);
        const hasOptions = availableStatuses.length > 0;
        
        let html = '<div class="flex items-center space-x-2">';
        
        // Status dropdown
        if (hasOptions) {
          html += `
            <select 
              class="status-select inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all duration-200"
              id="status-${app._id}">
              <option value="" disabled selected>Actions</option>
          `;
          
          availableStatuses.forEach((option: any) => {
            html += `<option value="${option.value}" class="text-sm">${option.label}</option>`;
          });
          
          html += '</select>';
        } else {
          html += '<span class="text-xs text-gray-400">No actions available</span>';
        }
        
        // History button
        html += `
          <button 
            class="history-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            id="history-${app._id}">
            📋
          </button>
        `;
        
        // View details button
        html += `
          <button 
            class="details-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200"
            id="details-${app._id}">
            👁️
          </button>
        </div>`;
        
        // Add event listeners after rendering
        setTimeout(() => {
          const statusSelect = document.getElementById(`status-${app._id}`) as HTMLSelectElement;
          const historyBtn = document.getElementById(`history-${app._id}`);
          const detailsBtn = document.getElementById(`details-${app._id}`);
          
          if (statusSelect) {
            statusSelect.addEventListener('change', (event) => {
              const newStatus = (event.target as HTMLSelectElement).value;
              if (newStatus) {
                this.onStatusChange(app._id, newStatus);
              }
            });
          }
          
          if (historyBtn) {
            historyBtn.addEventListener('click', () => {
              this.onViewHistory(app._id);
              this.changeDetectorRef.detectChanges();
            });
          }
          
          if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
              this.onViewDetails(app);
              this.changeDetectorRef.detectChanges();
            });
          }
        });
        
        return html;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100
  };

  gridOptions = {
    defaultColDef: {
      flex: 1,
      minWidth: 100,
    },
    rowHeight: 60, // Set row height to 60px
    tooltipShowDelay: 500,
    onSortChanged: (event: SortChangedEvent) => {
      this.onSortChanged(event);
    }
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('🔧 ClientApplicationsComponent: ngOnInit called');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ClientApplicationsComponent: ngOnChanges called');
    console.log('🔧 ClientApplicationsComponent: Applications updated:', this.applications);
    console.log('🔧 ClientApplicationsComponent: Pagination state:', this.paginationState);
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 ClientApplicationsComponent: Sort changed:', sort);
      
      // Map AG Grid field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        '_id': '_id',
        'resource.name': 'resource.name',
        'requirement.title': 'requirement.title',
        'status': 'status',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt'
      };
      
      const sortBy = fieldMapping[sort.colId] || sort.colId;
      const sortOrder = sort.sort as 'asc' | 'desc';
      
      this.sortChange.emit({ sortBy, sortOrder });
    }
  }

  getApplicationResourceName(app: any): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: any): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    switch (status.toLowerCase()) {
      case 'applied':
        return { color: 'bg-gray-100 text-gray-800', icon: 'file-text' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' };
      case 'shortlisted':
        return { color: 'bg-blue-100 text-blue-800', icon: 'check' };
      case 'interview':
        return { color: 'bg-purple-100 text-purple-800', icon: 'users' };
      case 'accepted':
        return { color: 'bg-green-100 text-green-800', icon: 'check-circle' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'x-circle' };
      case 'offer_created':
        return { color: 'bg-indigo-100 text-indigo-800', icon: 'file-text' };
      case 'onboarded':
        return { color: 'bg-teal-100 text-teal-800', icon: 'plus' };
      case 'did_not_join':
        return { color: 'bg-orange-100 text-orange-800', icon: 'x' };
      case 'withdrawn':
        return { color: 'bg-gray-100 text-gray-800', icon: 'x' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'help-circle' };
    }
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getResourceName(app: Application): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
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

  trackById(index: number, item: Application): string {
    return item._id || `application-${index}`;
  }

  onStatusChange(applicationId: string, newStatus: string): void {
    this.updateApplicationStatus.emit({ applicationId, status: newStatus });
  }

  onViewHistory(applicationId: string): void {
    this.viewApplicationHistory.emit(applicationId);
  }

  onViewDetails(application: Application): void {
    this.viewApplicationDetails.emit(application);
  }

  getAvailableStatuses(currentStatus: string): any[] {
    // Filter out the current status and return available options
    return this.availableStatuses.filter(status => status.value !== currentStatus);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
} 