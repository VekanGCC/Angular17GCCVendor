import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { SOW } from '../../../models/sow.model';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { AuditLogService } from '../../../services/audit-log.service';
import { VendorService } from '../../../services/vendor.service';
import { ApiService } from '../../../services/api.service';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-sow-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent,
    AuditTrailComponent
  ],
  templateUrl: './sow-management.component.html',
  styleUrls: ['./sow-management.component.scss']
})
export class SOWManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  sows: SOW[] = [];
  isLoading = false;
  totalSOWs = 0;
  currentPage = 1;
  pageSize = 10;

  // Pagination state
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // Modal states
  showCreateModal = false;
  showViewModal = false;
  showActionModal = false;
  selectedSOW: SOW | null = null;
  actionType: 'submit' | 'approve' | 'send-to-vendor' = 'submit';

  // Forms
  sowForm!: FormGroup;
  actionForm!: FormGroup;

  // Precomputed properties for template (fixing NG5002)
  submittedSOWsCount = 0;
  approvedSOWsCount = 0;
  vendorAcceptedSOWsCount = 0;

  // Precomputed values for selected SOW (fixing template expressions)
  selectedSOWShortId = '';
  selectedSOWStatusClass = '';
  selectedSOWStatusLabel = '';
  selectedSOWAmountDisplay = '';
  selectedSOWVendorName = '';
  selectedSOWStartDate = '';
  selectedSOWEndDate = '';

  // Precomputed values for audit trail
  selectedSOWForAuditShortId = '';

  // Precomputed vendor display values for form
  vendorDisplayOptions: Array<{id: string, display: string}> = [];
  isLoadingVendors = false;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'SOW ID',
      field: '_id',
      flex: 1,
      cellRenderer: (params: any) => {
        const sowId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${sowId ? sowId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      cellRenderer: (params: any) => {
        return `<div class="text-sm text-gray-900">${params.data.title}</div>`;
      }
    },
    {
      headerName: 'Vendor',
      field: 'vendorId',
      flex: 2,
      cellRenderer: (params: any) => {
        const vendor = params.data.vendorId;
        if (typeof vendor === 'object' && vendor) {
          return `<div class="text-sm text-gray-900">${vendor.firstName} ${vendor.lastName}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
      }
    },
    {
      headerName: 'Estimated Cost',
      field: 'estimatedCost',
      flex: 1,
      cellRenderer: (params: any) => {
        const cost = params.data.estimatedCost;
        if (cost) {
          return `<div class="text-sm text-gray-900">${cost.currency} ${cost.amount.toLocaleString()}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
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
      headerName: 'Created Date',
      field: 'createdAt',
      flex: 1,
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
      cellRenderer: (params: any) => {
        const sow = params.data;
        const actions = this.getAvailableActions(sow);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            id="view-${sow._id}">
            <span>👁️</span>
          </button>
        `;
        
        // Action buttons
        actions.forEach((action: any) => {
          html += `
            <button 
              class="action-btn text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
              id="${action.type}-${sow._id}">
              <span>${action.icon}</span>
            </button>
          `;
        });
        
        html += '</div>';
        
        return html;
      }
    }
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  gridOptions: GridOptions = {
    rowSelection: 'single',
    suppressRowClickSelection: true,
    onRowClicked: (event: any) => {
      // Handle row click if needed
    }
  };

  // Audit trail modal
  showAuditTrailModal = false;
  selectedSOWForAudit: SOW | null = null;

  constructor(
    private sowService: SOWService,
    private vendorService: VendorService,
    private authService: AuthService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadSOWs();
    this.loadVendors();
    
    // Test API connection
    this.testApiConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.sowForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      vendorId: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      estimatedCost: this.fb.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', Validators.required]
      })
    });

    this.actionForm = this.fb.group({
      comments: ['']
    });
  }

  loadSOWs(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    this.sowService.getSOWs({
      page: this.currentPage,
      limit: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.sows = response.data || [];
          this.totalSOWs = response.total || 0;
          
          // Update pagination state
          this.paginationState = {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalItems: this.totalSOWs,
            totalPages: Math.ceil(this.totalSOWs / this.pageSize),
            isLoading: false,
            hasNextPage: this.currentPage < Math.ceil(this.totalSOWs / this.pageSize),
            hasPreviousPage: this.currentPage > 1
          };

          this.updateSOWCounts();
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading SOWs:', error);
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updateSOWCounts(): void {
    this.submittedSOWsCount = this.sows.filter(sow => sow.status === 'submitted').length;
    this.approvedSOWsCount = this.sows.filter(sow => sow.status === 'internal_approved').length;
    this.vendorAcceptedSOWsCount = this.sows.filter(sow => sow.status === 'vendor_accepted').length;
  }

  loadVendors(): void {
    console.log('🔧 SOW Management: Loading vendors from database...');
    this.isLoadingVendors = true;
    this.apiService.getVendors().subscribe({
      next: (response: any) => {
        console.log('🔧 SOW Management: Vendors API response:', response);
        
        // Handle different response formats
        let vendors = [];
        if (response.success && response.data) {
          vendors = response.data;
        } else if (Array.isArray(response)) {
          vendors = response;
        } else if (response.data && Array.isArray(response.data)) {
          vendors = response.data;
        }
        
        if (vendors.length > 0) {
          this.vendorDisplayOptions = vendors.map((vendor: any) => ({
            id: vendor._id || vendor.id,
            display: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.email || 'Unknown Vendor'
          }));
          console.log('🔧 SOW Management: Loaded vendors:', this.vendorDisplayOptions);
        } else {
          console.warn('🔧 SOW Management: No vendors found in response');
          this.vendorDisplayOptions = [];
        }
        this.isLoadingVendors = false;
      },
      error: (error: any) => {
        console.error('🔧 SOW Management: Error loading vendors:', error);
        console.error('🔧 SOW Management: Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.isLoadingVendors = false;
        this.vendorDisplayOptions = [];
      }
    });
  }

  onCreateSOW(): void {
    console.log('🔧 SOW Management: Opening create SOW modal');
    this.showCreateModal = true;
    this.sowForm.reset({
      estimatedCost: {
        amount: '',
        currency: 'USD'
      }
    });
    
    // Ensure vendors are loaded when modal opens
    this.loadVendors();
  }

  onSubmitSOW(): void {
    if (this.sowForm.valid) {
      this.isLoading = true;
      const formValue = this.sowForm.value;
      
      const sowData = {
        ...formValue,
        estimatedCost: {
          amount: parseFloat(formValue.estimatedCost.amount),
          currency: formValue.estimatedCost.currency
        }
      };

      this.sowService.createSOW(sowData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showCreateModal = false;
            this.loadSOWs();
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error creating SOW:', error);
            this.isLoading = false;
          }
        });
    }
  }

  onViewSOW(sow: SOW): void {
    this.selectedSOW = sow;
    this.updateSelectedSOWDisplay();
    this.showViewModal = true;
  }

  onActionClick(sow: SOW, actionType: string): void {
    this.selectedSOW = sow;
    this.actionType = actionType as 'submit' | 'approve' | 'send-to-vendor';
    this.actionForm.reset();
    this.showActionModal = true;
  }

  onActionSubmit(): void {
    if (this.selectedSOW && this.actionForm.valid) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      let actionObservable;
      switch (this.actionType) {
        case 'submit':
          actionObservable = this.sowService.submitSOW(this.selectedSOW._id);
          break;
        case 'approve':
          actionObservable = this.sowService.approveSOW(this.selectedSOW._id, comments);
          break;
        case 'send-to-vendor':
          actionObservable = this.sowService.sendToVendor(this.selectedSOW._id);
          break;
        default:
          this.isLoading = false;
          return;
      }

      actionObservable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.showActionModal = false;
          this.loadSOWs();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error(`Error performing ${this.actionType} action:`, error);
          this.isLoading = false;
        }
      });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSOWs();
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showActionModal = false;
    this.selectedSOW = null;
    this.resetSelectedSOWDisplay();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'internal_approved':
        return 'bg-green-100 text-green-800';
      case 'vendor_accepted':
        return 'bg-purple-100 text-purple-800';
      case 'vendor_rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAvailableActions(sow: SOW): Array<{type: string, icon: string, label: string}> {
    const actions = [];
    
    if (sow.status === 'draft') {
      actions.push({ type: 'submit', icon: '📤', label: 'Submit' });
    }
    
    if (sow.status === 'submitted') {
      actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
    }
    
    if (sow.status === 'internal_approved') {
      actions.push({ type: 'send-to-vendor', icon: '📧', label: 'Send to Vendor' });
    }
    
    return actions;
  }

  trackById(index: number, item: SOW): string {
    return item._id;
  }

  getShortSOWId(sowId: string): string {
    return sowId ? `#${sowId.slice(-6)}` : 'N/A';
  }

  getSOWAmountDisplay(sow: SOW): string {
    if (sow.estimatedCost && sow.estimatedCost.amount) {
      return `${sow.estimatedCost.currency} ${sow.estimatedCost.amount.toLocaleString()}`;
    }
    return 'N/A';
  }

  getVendorDisplay(vendor: any): string {
    if (vendor && typeof vendor === 'object') {
      return `${vendor.firstName} ${vendor.lastName}`;
    }
    return 'Unknown Vendor';
  }

  private updateSelectedSOWDisplay(): void {
    if (!this.selectedSOW) {
      this.resetSelectedSOWDisplay();
      return;
    }

    this.selectedSOWShortId = this.getShortSOWId(this.selectedSOW._id);
    this.selectedSOWStatusClass = this.getStatusClass(this.selectedSOW.status);
    this.selectedSOWStatusLabel = this.formatStatus(this.selectedSOW.status);
    this.selectedSOWAmountDisplay = this.getSOWAmountDisplay(this.selectedSOW);
    this.selectedSOWVendorName = this.getVendorDisplay(this.selectedSOW.vendorId);
    this.selectedSOWStartDate = this.selectedSOW.startDate ? new Date(this.selectedSOW.startDate).toLocaleDateString() : 'N/A';
    this.selectedSOWEndDate = this.selectedSOW.endDate ? new Date(this.selectedSOW.endDate).toLocaleDateString() : 'N/A';
  }

  private resetSelectedSOWDisplay(): void {
    this.selectedSOWShortId = '';
    this.selectedSOWStatusClass = '';
    this.selectedSOWStatusLabel = '';
    this.selectedSOWAmountDisplay = '';
    this.selectedSOWVendorName = '';
    this.selectedSOWStartDate = '';
    this.selectedSOWEndDate = '';
  }

  showAuditTrail(sow: SOW): void {
    this.selectedSOWForAudit = sow;
    this.selectedSOWForAuditShortId = this.getShortSOWId(sow._id);
    this.showAuditTrailModal = true;
  }

  closeAuditTrailModal(): void {
    this.showAuditTrailModal = false;
    this.selectedSOWForAudit = null;
    this.selectedSOWForAuditShortId = '';
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get showSOWModal() {
    return this.showCreateModal || this.showViewModal || this.showActionModal;
  }

  showSuccessMessage(message: string): void {
    // Implement success message display
    console.log('Success:', message);
  }

  showErrorMessage(message: string): void {
    // Implement error message display
    console.error('Error:', message);
  }

  // Test method to check API connection
  testApiConnection(): void {
    console.log('🔧 SOW Management: Testing API connection...');
    
    // Test vendors route
    this.apiService.getVendors().subscribe({
      next: (response: any) => {
        console.log('🔧 SOW Management: Vendors API test successful:', response);
      },
      error: (error: any) => {
        console.error('🔧 SOW Management: Vendors API test failed:', error);
      }
    });
  }
} 