// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';
import { Application } from '../../../models/application.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-vendor-applications',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent],
  templateUrl: './vendor-applications.component.html',
  styleUrls: ['./vendor-applications.component.scss']
})
export class VendorApplicationsComponent implements OnInit {
  @Input() applications: Application[] = [];
  @Input() isLoading = false;
  @Input() paginationState!: PaginationState;
  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string}>();
  @Output() viewApplicationHistory = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();

  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Application ID', 
      field: '_id', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const appId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${appId ? appId.slice(-6) : 'N/A'}</div>`;
      }
    },
    { 
      headerName: 'Resource', 
      field: 'resource.name', 
      flex: 2,
      sortable: true,
      valueGetter: (params: any) => {
        if (typeof params.data.resource === 'string') {
          return 'Unknown';
        }
        return params.data.resource?.name || 'Unknown';
      },
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
      valueGetter: (params: any) => {
        if (typeof params.data.requirement === 'string') {
          return 'Unknown';
        }
        return params.data.requirement?.title || 'Unknown';
      },
      cellRenderer: (params: any) => {
        const requirementTitle = this.getRequirementTitle(params.data);
        return `<div class="text-sm text-gray-900">${requirementTitle}</div>`;
      }
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const statusClass = this.getStatusClass(status);
        const statusText = this.formatStatus(status);
        
        return `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        `;
      }
    },
    { 
      headerName: 'Applied Date', 
      field: 'createdAt', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const date = params.data.createdAt;
        const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
        return `<div class="text-sm text-gray-500">${formattedDate}</div>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const application = params.data;
        const hasOptions = this.hasStatusOptions(application.status);
        const statusOptions = this.getAvailableStatusOptions(application.status);
        
        let html = '<div class="flex items-center justify-end space-x-2">';
        
        // Status dropdown
        if (hasOptions) {
          html += `
            <select 
              class="status-select text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="status-${application._id}">
              <option value="" disabled selected>Actions</option>
          `;
          
          statusOptions.forEach((option: any) => {
            html += `<option value="${option.value}" class="text-sm">${option.label}</option>`;
          });
          
          html += '</select>';
        } else {
          html += '<span class="text-xs text-gray-400">No actions available</span>';
        }
        
        // History button
        html += `
          <button 
            class="history-btn text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
            id="history-${application._id}">
            <span>📋</span>
          </button>
        `;
        
        html += '</div>';
        
        // Add event listeners after rendering
        setTimeout(() => {
          const statusSelect = document.getElementById(`status-${application._id}`) as HTMLSelectElement;
          const historyBtn = document.getElementById(`history-${application._id}`);
          
          if (statusSelect) {
            statusSelect.addEventListener('change', (event) => {
              const newStatus = (event.target as HTMLSelectElement).value;
              if (newStatus) {
                this.onStatusChange(application._id, newStatus);
              }
            });
          }
          
          if (historyBtn) {
            historyBtn.addEventListener('click', () => this.onViewHistory(application._id));
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
    tooltipShowDelay: 500,
    onSortChanged: (event: SortChangedEvent) => {
      this.onSortChanged(event);
    }
  };

  constructor() {}

  ngOnInit(): void {
    console.log('🔧 VendorApplicationsComponent: ngOnInit called');
  }

  ngOnChanges(): void {
    console.log('🔧 VendorApplicationsComponent: ngOnChanges called');
    console.log('🔧 VendorApplicationsComponent: Applications updated:', this.applications);
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 VendorApplicationsComponent: Sort changed:', sort);
      
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