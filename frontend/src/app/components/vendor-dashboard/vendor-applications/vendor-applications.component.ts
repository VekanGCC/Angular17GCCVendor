// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, OnInit, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { Application } from '../../../models/application.model';
import { PaginationState, PaginationParams, PaginatedResponse } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ApplicationActionModalComponent } from '../../modals/application-action-modal/application-action-modal.component';
import { VendorService } from '../../../services/vendor.service';
import { VendorApplicationsService } from '../../../services/vendor-applications.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

export interface ApplicationActionData {
  applicationId: string;
  status: string;
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
  followUpDate?: Date;
  followUpNotes?: string;
}

@Component({
  selector: 'app-vendor-applications',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent, ApplicationActionModalComponent],
  templateUrl: './vendor-applications.component.html',
  styleUrls: ['./vendor-applications.component.scss']
})
export class VendorApplicationsComponent implements OnInit, OnChanges {
  applications: Application[] = [];
  isLoading = false;
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };
  resourceFilter: string = '';

  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string, actionData?: ApplicationActionData}>();

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // Modal state
  showActionModal = false;
  selectedApplication: Application | null = null;
  selectedActionType: 'revoke' | 'accept_offer' | 'reject_offer' = 'revoke';



  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Application ID', 
      field: '_id', 
      flex: 1,
      sortable: false,
      filter: false,
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        if (typeof params.data.resource === 'string') {
          return 'Unknown';
        }
        return params.data.resource?.name || 'Unknown';
      },
      cellRenderer: (params: any) => {
        const resourceName = this.getResourceName(params.data);
        const displayName = resourceName.length > 20 ? resourceName.substring(0, 20) + '...' : resourceName;
        return `<div class="text-sm text-gray-900" title="${resourceName}">${displayName}</div>`;
      }
    },
    { 
      headerName: 'Requirement', 
      field: 'requirement.title', 
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        if (typeof params.data.requirement === 'string') {
          return 'Unknown';
        }
        return params.data.requirement?.title || 'Unknown';
      },
      cellRenderer: (params: any) => {
        const requirementTitle = this.getRequirementTitle(params.data);
        const displayTitle = requirementTitle.length > 20 ? requirementTitle.substring(0, 20) + '...' : requirementTitle;
        return `<div class="text-sm text-gray-900" title="${requirementTitle}">${displayTitle}</div>`;
      }
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      flex: 1,
      sortable: false,
      filter: false,
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
      sortable: false,
      filter: false,
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
      sortable: false,
      filter: false,
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
            statusSelect.addEventListener('change', (event) => {
              const newStatus = (event.target as HTMLSelectElement).value;
              if (newStatus) {
                this.onStatusChange(application._id, newStatus, application);
              }
            });
          }
          
          if (historyBtn) {
            historyBtn.addEventListener('click', () => {
              this.onViewHistory(application._id);
            });
          }
        }, 100); // Increased timeout to ensure DOM is ready
        
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

  gridOptions = {
    defaultColDef: {
      flex: 1,
      minWidth: 100,
    },
    rowHeight: 60,
    tooltipShowDelay: 500
  };

  get filteredApplications(): Application[] {
    // Since we're using backend filtering, just return the applications array
    // The backend already filters by resource ID when resourceFilter is provided
    return this.applications;
  }

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private vendorService: VendorService,
    private vendorApplicationsService: VendorApplicationsService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🔧 VendorApplicationsComponent: ngOnInit called');
    
    // Get resourceId from route parameters
    this.activatedRoute.queryParams.subscribe(params => {
      this.resourceFilter = params['resourceId'] || '';
      console.log('🔧 VendorApplicationsComponent: Resource filter from route:', this.resourceFilter);
      this.loadApplications();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // This will be called whenever the properties change
    console.log('🔧 VendorApplications: Applications data changed:', this.applications);
    
    // If applications data changed, refresh the grid
    if (changes['applications'] && this.agGrid && this.agGrid.api) {
      console.log('🔧 VendorApplications: Applications changed, refreshing grid');
      this.refreshGridData();
    }
  }

  loadApplications(): void {
    console.log('🔄 VendorApplications: Loading applications...');
    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params: PaginationParams = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize
    };

    // Use different service method based on whether resource filter is provided
    let observable: Observable<PaginatedResponse<any>>;
    
    if (this.resourceFilter) {
      console.log('🔄 VendorApplications: Loading applications filtered by resource ID:', this.resourceFilter);
      observable = this.vendorService.getApplicationsByResourceId(this.resourceFilter, params);
    } else {
      console.log('🔄 VendorApplications: Loading all applications');
      observable = this.vendorService.getApplications(params);
    }

    observable.subscribe({
      next: (response) => {
        console.log('✅ VendorApplications: Applications loaded successfully:', response);
        this.applications = response.data || [];
        
        // Handle pagination data - check both meta and pagination properties
        const paginationData = response.meta || response.pagination;
        this.paginationState = {
          ...this.paginationState,
          totalItems: paginationData?.total || 0,
          totalPages: (paginationData as any)?.pages || paginationData?.totalPages || 0,
          hasNextPage: (paginationData?.page || 1) < ((paginationData as any)?.pages || paginationData?.totalPages || 1),
          hasPreviousPage: (paginationData?.page || 1) > 1,
          isLoading: false
        };
        
        console.log('✅ VendorApplications: Pagination state updated:', this.paginationState);
        console.log('✅ VendorApplications: Applications array:', this.applications);
        
        this.isLoading = false;
        this.refreshGridData();
      },
      error: (error) => {
        console.error('❌ VendorApplications: Error loading applications:', error);
        this.isLoading = false;
        this.paginationState.isLoading = false;
      }
    });
  }

  private refreshGridData(): void {
    if (this.agGrid && this.agGrid.api) {
      // Force AG Grid to refresh all data
      this.agGrid.api.refreshCells({ force: true });
      console.log('🔧 VendorApplications: Grid data refreshed');
    }
  }

  onGridReady(event: any): void {
    console.log('🔧 VendorApplications: Grid ready, API captured');
    
    // Set initial data if applications are already available
    if (this.applications && this.applications.length > 0) {
      console.log('🔧 VendorApplications: Setting initial data in grid');
      this.refreshGridData();
    }
  }

  getResourceName(app: Application): string {
    if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return app.resource?.name || 'Unknown Resource';
  }

  getRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return app.requirement?.title || 'Unknown Requirement';
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'revoked':
        return 'bg-orange-100 text-orange-800';
      case 'offer_sent':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer_accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'offer_rejected':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  getAvailableStatusOptions(currentStatus: string): any[] {
    const status = currentStatus?.toLowerCase();
    
    // Vendor perspective - what actions can vendor take at each status
    
    // Applied - vendor can only revoke
    if (status === 'applied') {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Shortlisted - vendor can only revoke
    if (status === 'shortlisted') {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Interview - vendor can only revoke
    if (status === 'interview') {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Accepted - vendor can only revoke
    if (status === 'accepted') {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Offer Created - vendor can accept or reject the offer
    if (status === 'offer_created') {
      return [
        { value: 'offer_accepted', label: 'Accept Offer', color: 'bg-green-100 text-green-800' },
        { value: 'rejected', label: 'Reject Offer', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Offer Accepted - vendor can only revoke
    if (status === 'offer_accepted') {
      return [
        { value: 'withdrawn', label: 'Revoke Candidate', color: 'bg-red-100 text-red-800' }
      ];
    }
    
    // Onboarded, did_not_join, withdrawn, rejected - no actions available
    if (['onboarded', 'did_not_join', 'withdrawn', 'rejected'].includes(status)) {
      return [];
    }
    
    // Default - no options
    return [];
  }

  hasStatusOptions(status: string): boolean {
    return this.getAvailableStatusOptions(status).length > 0;
  }

  onStatusChange(applicationId: string, newStatus: string, application: Application): void {
    console.log('🔄 VendorApplications: Status change requested:', { applicationId, newStatus });
    
    // Determine action type based on new status
    let actionType: 'revoke' | 'accept_offer' | 'reject_offer' = 'revoke';
    
    if (newStatus === 'offer_accepted') {
      actionType = 'accept_offer';
    } else if (newStatus === 'rejected') {
      actionType = 'reject_offer';
    } else if (newStatus === 'withdrawn') {
      actionType = 'revoke';
    }
    
    console.log('🔄 VendorApplications: Determined actionType:', actionType);
    
    // Show confirmation modal
    this.selectedApplication = application;
    this.selectedActionType = actionType;
    this.showActionModal = true;
    
    console.log('🔄 VendorApplications: Modal state set - showActionModal:', this.showActionModal, 'selectedActionType:', this.selectedActionType);
    
    // Force change detection to ensure the modal appears
    this.changeDetectorRef.detectChanges();
    
    // Add a small delay to ensure modal is properly initialized
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 100);
  }

  onActionModalClose(): void {
    this.showActionModal = false;
    this.selectedApplication = null;
    this.changeDetectorRef.detectChanges();
  }

  onActionModalConfirm(actionData: ApplicationActionData): void {
    console.log('🔧 VendorApplicationsComponent: Action confirmed:', actionData);
    
    // Close modal first
    this.showActionModal = false;
    this.selectedApplication = null;
    
    // Emit the action data to parent component with enhanced data
    this.updateApplicationStatus.emit({ 
      applicationId: actionData.applicationId, 
      status: actionData.status,
      notes: actionData.decisionReason?.notes || actionData.decisionReason?.details,
      actionData: actionData // Pass the full action data for enhanced tracking
    });
    
    // Force change detection to ensure the event is processed immediately
    this.changeDetectorRef.detectChanges();
  }

  onViewHistory(applicationId: string): void {
    console.log('🔄 VendorApplications: Viewing history for application:', applicationId);
    this.vendorApplicationsService.viewApplicationHistory(applicationId);
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadApplications();
  }

  onClearFilter(): void {
    console.log('🔄 VendorApplications: Clearing resource filter');
    this.resourceFilter = '';
    this.paginationState.currentPage = 1; // Reset to first page
    this.loadApplications();
  }

  trackById(index: number, item: Application): string {
    return item._id || `application-${index}`;
  }


} 