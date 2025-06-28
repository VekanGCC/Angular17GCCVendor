import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { PO } from '../../../models/po.model';
import { SOW } from '../../../models/sow.model';
import { PaginationState } from '../../../models/pagination.model';
import { POService } from '../../../services/po.service';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-po-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent
  ],
  templateUrl: './po-management.component.html',
  styleUrls: ['./po-management.component.scss']
})
export class POManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  pos: PO[] = [];
  availableSOWs: SOW[] = [];
  isLoading = false;
  totalPOs = 0;
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
  selectedPO: PO | null = null;
  actionType: 'submit' | 'approve' | 'send-to-vendor' = 'submit';

  // Forms
  poForm!: FormGroup;
  actionForm!: FormGroup;

  // Precomputed properties for template (fixing NG5002)
  submittedPOCount = 0;
  financeApprovedPOCount = 0;
  vendorAcceptedPOCount = 0;

  // Precomputed values for selected PO (fixing template expressions)
  selectedPOShortId = '';
  selectedPOStatusClass = '';
  selectedPOStatusLabel = '';
  selectedPOAmountDisplay = '';
  selectedPOSOWTitle = '';
  selectedPOVendorName = '';
  selectedPOPaymentTerms = '';
  selectedPOCreatedDate = '';
  selectedPOFinanceApprovalStatus = '';
  selectedPOFinanceApprovalComments = '';
  selectedPOFinanceApprovalDate = '';
  selectedPOVendorResponseStatus = '';
  selectedPOVendorResponseComments = '';
  selectedPOVendorResponseDate = '';

  // Precomputed SOW display values for form
  sowDisplayOptions: Array<{id: string, display: string}> = [];

  // View model for PO grid data
  poGridData: Array<{
    id: string;
    shortId: string;
    sowTitle: string;
    vendorName: string;
    amountDisplay: string;
    statusClass: string;
    statusLabel: string;
    createdDate: string;
    actions: Array<{type: string, icon: string, label: string}>;
  }> = [];

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'PO ID',
      field: '_id',
      flex: 1,
      cellRenderer: (params: any) => {
        const poId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${poId ? poId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'SOW Reference',
      field: 'sowId',
      flex: 2,
      cellRenderer: (params: any) => {
        const sow = params.data.sowId;
        if (this.isSOWPopulated(sow)) {
          return `<div class="text-sm text-gray-900">${this.getSOWTitle(sow)}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
      }
    },
    {
      headerName: 'Vendor',
      field: 'vendorId',
      flex: 2,
      cellRenderer: (params: any) => {
        const vendor = params.data.vendorId;
        if (this.isVendorPopulated(vendor)) {
          return `<div class="text-sm text-gray-900">${this.getVendorName(vendor)}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
      }
    },
    {
      headerName: 'Total Amount',
      field: 'totalAmount',
      flex: 1,
      cellRenderer: (params: any) => {
        const amount = params.data.totalAmount;
        if (amount) {
          return `<div class="text-sm text-gray-900">${amount.currency} ${amount.amount.toLocaleString()}</div>`;
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
        const po = params.data;
        const actions = this.getAvailableActions(po);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            id="view-${po._id}">
            <span>👁️</span>
          </button>
        `;
        
        // Action buttons
        actions.forEach((action: any) => {
          html += `
            <button 
              class="action-btn text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
              id="${action.type}-${po._id}">
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

  constructor(
    private poService: POService,
    private sowService: SOWService,
    private authService: AuthService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadPOs();
    this.loadAvailableSOWs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.poForm = this.fb.group({
      sowId: ['', Validators.required],
      poNumber: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      totalAmount: this.fb.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', Validators.required]
      }),
      deliveryDate: ['', Validators.required],
      terms: ['']
    });

    this.actionForm = this.fb.group({
      comments: ['']
    });
  }

  loadPOs(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    this.poService.getPOs({
      page: this.currentPage,
      limit: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.pos = response.data || [];
          this.totalPOs = response.total || 0;
          
          // Update pagination state
          this.paginationState = {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalItems: this.totalPOs,
            totalPages: Math.ceil(this.totalPOs / this.pageSize),
            isLoading: false,
            hasNextPage: this.currentPage < Math.ceil(this.totalPOs / this.pageSize),
            hasPreviousPage: this.currentPage > 1
          };

          this.updatePOCounts();
          this.updatePOGridData();
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading POs:', error);
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updatePOCounts(): void {
    this.submittedPOCount = this.pos.filter(po => po.status === 'submitted').length;
    this.financeApprovedPOCount = this.pos.filter(po => po.status === 'finance_approved').length;
    this.vendorAcceptedPOCount = this.pos.filter(po => po.status === 'vendor_accepted').length;
  }

  private updatePOGridData(): void {
    this.poGridData = this.pos.map(po => ({
      id: po._id,
      shortId: this.getShortPOId(po._id),
      sowTitle: this.getSOWDisplay(po.sowId),
      vendorName: this.getVendorDisplay(po.vendorId),
      amountDisplay: this.getPOAmountDisplay(po),
      statusClass: this.getStatusClass(po.status),
      statusLabel: this.formatStatus(po.status),
      createdDate: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A',
      actions: this.getAvailableActions(po)
    }));
  }

  getShortPOId(poId: string): string {
    return poId ? `#${poId.slice(-6)}` : 'N/A';
  }

  getSOWDisplay(sow: any): string {
    if (this.isSOWPopulated(sow)) {
      return this.getSOWTitle(sow);
    }
    return 'Unknown SOW';
  }

  getVendorDisplay(vendor: any): string {
    if (this.isVendorPopulated(vendor)) {
      return this.getVendorName(vendor);
    }
    return 'Unknown Vendor';
  }

  getPOAmountDisplay(po: PO): string {
    if (po.totalAmount && po.totalAmount.amount) {
      return `${po.totalAmount.currency} ${po.totalAmount.amount.toLocaleString()}`;
    }
    return 'N/A';
  }

  private updateSelectedPODisplay(): void {
    if (!this.selectedPO) {
      this.resetSelectedPODisplay();
      return;
    }

    this.selectedPOShortId = this.getShortPOId(this.selectedPO._id);
    this.selectedPOStatusClass = this.getStatusClass(this.selectedPO.status);
    this.selectedPOStatusLabel = this.formatStatus(this.selectedPO.status);
    this.selectedPOAmountDisplay = this.getPOAmountDisplay(this.selectedPO);
    this.selectedPOSOWTitle = this.getSOWDisplay(this.selectedPO.sowId);
    this.selectedPOVendorName = this.getVendorDisplay(this.selectedPO.vendorId);
    this.selectedPOPaymentTerms = this.selectedPO.paymentTermsDisplay || this.selectedPO.paymentTerms || 'N/A';
    this.selectedPOCreatedDate = this.selectedPO.createdAt ? new Date(this.selectedPO.createdAt).toLocaleDateString() : 'N/A';

    // Finance approval details
    if (this.selectedPO.financeApproval) {
      this.selectedPOFinanceApprovalStatus = this.selectedPO.financeApproval.status || 'N/A';
      this.selectedPOFinanceApprovalComments = this.selectedPO.financeApproval.comments || 'N/A';
      this.selectedPOFinanceApprovalDate = this.selectedPO.financeApproval.date ? 
        new Date(this.selectedPO.financeApproval.date).toLocaleDateString() : 'N/A';
    } else {
      this.selectedPOFinanceApprovalStatus = 'N/A';
      this.selectedPOFinanceApprovalComments = 'N/A';
      this.selectedPOFinanceApprovalDate = 'N/A';
    }

    // Vendor response details
    if (this.selectedPO.vendorResponse) {
      this.selectedPOVendorResponseStatus = this.selectedPO.vendorResponse.status || 'N/A';
      this.selectedPOVendorResponseComments = this.selectedPO.vendorResponse.comments || 'N/A';
      this.selectedPOVendorResponseDate = this.selectedPO.vendorResponse.responseDate ? 
        new Date(this.selectedPO.vendorResponse.responseDate).toLocaleDateString() : 'N/A';
    } else {
      this.selectedPOVendorResponseStatus = 'N/A';
      this.selectedPOVendorResponseComments = 'N/A';
      this.selectedPOVendorResponseDate = 'N/A';
    }
  }

  private resetSelectedPODisplay(): void {
    this.selectedPOShortId = '';
    this.selectedPOStatusClass = '';
    this.selectedPOStatusLabel = '';
    this.selectedPOAmountDisplay = '';
    this.selectedPOSOWTitle = '';
    this.selectedPOVendorName = '';
    this.selectedPOPaymentTerms = '';
    this.selectedPOCreatedDate = '';
    this.selectedPOFinanceApprovalStatus = '';
    this.selectedPOFinanceApprovalComments = '';
    this.selectedPOFinanceApprovalDate = '';
    this.selectedPOVendorResponseStatus = '';
    this.selectedPOVendorResponseComments = '';
    this.selectedPOVendorResponseDate = '';
  }

  loadAvailableSOWs(): void {
    this.sowService.getSOWs({
      page: 1,
      limit: 1000
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.availableSOWs = response.data || [];
          this.updateSOWDisplayOptions();
        },
        error: (error: any) => {
          console.error('Error loading SOWs:', error);
        }
      });
  }

  private updateSOWDisplayOptions(): void {
    this.sowDisplayOptions = this.availableSOWs.map(sow => ({
      id: sow._id,
      display: this.getSOWDisplay(sow)
    }));
  }

  onCreatePO(): void {
    this.showCreateModal = true;
    this.poForm.reset({
      totalAmount: {
        amount: '',
        currency: 'USD'
      }
    });
  }

  onSubmitPO(): void {
    if (this.poForm.valid) {
      this.isLoading = true;
      const formValue = this.poForm.value;
      
      const poData = {
        ...formValue,
        totalAmount: {
          amount: parseFloat(formValue.totalAmount.amount),
          currency: formValue.totalAmount.currency
        }
      };

      this.poService.createPO(poData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.showCreateModal = false;
            this.loadPOs();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creating PO:', error);
            this.isLoading = false;
          }
        });
    }
  }

  onViewPO(po: PO): void {
    this.selectedPO = po;
    this.updateSelectedPODisplay();
    this.showViewModal = true;
  }

  onActionClick(po: PO, actionType: string): void {
    this.selectedPO = po;
    this.actionType = actionType as 'submit' | 'approve' | 'send-to-vendor';
    this.actionForm.reset();
    this.showActionModal = true;
  }

  onActionSubmit(): void {
    if (this.selectedPO && this.actionForm.valid) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      let actionObservable;
      switch (this.actionType) {
        case 'submit':
          actionObservable = this.poService.submitPO(this.selectedPO._id);
          break;
        case 'approve':
          actionObservable = this.poService.financeApproval(this.selectedPO._id, { 
            status: 'approved', 
            comments 
          });
          break;
        case 'send-to-vendor':
          actionObservable = this.poService.sendToVendor(this.selectedPO._id);
          break;
        default:
          this.isLoading = false;
          return;
      }

      actionObservable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.showActionModal = false;
          this.loadPOs();
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
    this.loadPOs();
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showActionModal = false;
    this.selectedPO = null;
    this.resetSelectedPODisplay();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'finance_approved':
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

  getAvailableActions(po: PO): Array<{type: string, icon: string, label: string}> {
    const actions = [];
    
    if (po.status === 'draft') {
      actions.push({ type: 'submit', icon: '📤', label: 'Submit' });
    }
    
    if (po.status === 'submitted') {
      actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
    }
    
    if (po.status === 'finance_approved') {
      actions.push({ type: 'send-to-vendor', icon: '📧', label: 'Send to Vendor' });
    }
    
    return actions;
  }

  trackById(index: number, item: PO): string {
    return item._id;
  }

  isSOWPopulated(sowId: any): boolean {
    return sowId && typeof sowId === 'object' && sowId.title;
  }

  isVendorPopulated(vendorId: any): boolean {
    return vendorId && typeof vendorId === 'object' && vendorId.companyName;
  }

  getSOWTitle(sowId: any): string {
    if (this.isSOWPopulated(sowId)) {
      return sowId.title;
    }
    return 'Unknown SOW';
  }

  getVendorName(vendorId: any): string {
    if (this.isVendorPopulated(vendorId)) {
      return vendorId.companyName;
    }
    return 'Unknown Vendor';
  }
} 