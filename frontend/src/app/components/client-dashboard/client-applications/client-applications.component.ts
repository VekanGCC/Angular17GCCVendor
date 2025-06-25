import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Application } from '../../../models/application.model';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-client-applications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent],
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
  @Input() currentFilter: any = {};
  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string}>();
  @Output() viewApplicationHistory = new EventEmitter<string>();
  @Output() viewApplicationDetails = new EventEmitter<Application>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() clearFilter = new EventEmitter<void>();

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

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
      headerName: 'Application ID', 
      field: '_id', 
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const appId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${appId ? appId.slice(-6) : 'N/A'}</div>`;
      }
    },
    { 
      headerName: 'Resource', 
      field: 'resource.name', 
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const application = params.data;
        const hasOptions = this.hasStatusOptions(application.status);
        const statusOptions = this.getAvailableStatusOptions(application.status);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
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
            // Remove existing event listener if it exists
            const existingHandler = (statusSelect as any)._changeHandler;
            if (existingHandler) {
              statusSelect.removeEventListener('change', existingHandler);
            }
            
            const changeHandler = (event: Event) => {
              const newStatus = (event.target as HTMLSelectElement).value;
              if (newStatus) {
                this.onStatusChange(application._id, newStatus);
              }
            };
            statusSelect.addEventListener('change', changeHandler);
            (statusSelect as any)._changeHandler = changeHandler; // Store reference for removal
          }
          
          if (historyBtn) {
            // Remove existing event listener if it exists
            const existingHandler = (historyBtn as any)._clickHandler;
            if (existingHandler) {
              historyBtn.removeEventListener('click', existingHandler);
            }
            
            const clickHandler = () => this.onViewHistory(application._id);
            historyBtn.addEventListener('click', clickHandler);
            (historyBtn as any)._clickHandler = clickHandler; // Store reference for removal
          }
        });
        
        return html;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: false,
    filter: false,
    flex: 1,
    minWidth: 100
  };

  gridOptions: any = {
    pagination: false,
    rowHeight: 60,
    tooltipShowDelay: 500,
    suppressRowClickSelection: true,
    suppressCellFocus: true
  };

  constructor(private changeDetectorRef: ChangeDetectorRef, private clientService: ClientService) {}

  ngOnInit(): void {
    console.log('🔧 ClientApplicationsComponent: ngOnInit called');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ClientApplicationsComponent: ngOnChanges called');
    
    // If applications data changed, refresh the grid
    if (changes['applications'] && this.agGrid && this.agGrid.api) {
      console.log('🔧 ClientApplicationsComponent: Applications changed, refreshing grid');
      this.refreshGridData();
    }
  }

  private refreshGridData(): void {
    if (this.agGrid && this.agGrid.api) {
      // Force AG Grid to refresh all data
      this.agGrid.api.refreshCells({ force: true });
      console.log('🔧 ClientApplicationsComponent: Grid data refreshed');
    }
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

  onGridReady(event: any): void {
    console.log('🔧 ClientApplicationsComponent: Grid ready');
    // Store reference to grid API for later use
    this.agGrid = event;
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
    console.log('🔧 ClientApplicationsComponent: Status change requested:', applicationId, newStatus);
    this.updateApplicationStatus.emit({ applicationId, status: newStatus });
    // Force change detection to ensure the event is processed immediately
    this.changeDetectorRef.detectChanges();
  }

  onViewHistory(applicationId: string): void {
    console.log('🔧 ClientApplicationsComponent: View history clicked for application:', applicationId);
    this.viewApplicationHistory.emit(applicationId);
    // Force change detection to ensure the modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  onViewDetails(application: Application): void {
    this.viewApplicationDetails.emit(application);
  }

  getAvailableStatuses(currentStatus: string): any[] {
    // Return available status transitions based on current status
    switch (currentStatus) {
      case 'applied':
        return [
          { value: 'shortlisted', label: 'Shortlist' },
          { value: 'rejected', label: 'Reject' }
        ];
      case 'shortlisted':
        return [
          { value: 'interview', label: 'Interview' },
          { value: 'rejected', label: 'Reject' }
        ];
      case 'interview':
        return [
          { value: 'accepted', label: 'Accept' },
          { value: 'rejected', label: 'Reject' }
        ];
      case 'accepted':
        return [
          { value: 'offer_created', label: 'Create Offer' }
        ];
      case 'offer_created':
        return [
          { value: 'onboarded', label: 'Onboarded' },
          { value: 'did_not_join', label: 'Did Not Join' }
        ];
      default:
        return [];
    }
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  hasStatusOptions(status: string): boolean {
    const availableStatuses = this.getAvailableStatuses(status);
    return availableStatuses.length > 0;
  }

  getAvailableStatusOptions(status: string): any[] {
    return this.getAvailableStatuses(status);
  }
} 