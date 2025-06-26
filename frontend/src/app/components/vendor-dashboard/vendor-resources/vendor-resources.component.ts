// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { Resource } from '../../../models/resource.model';
import { PaginationState, PaginationParams } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { VendorService } from '../../../services/vendor.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-vendor-resources',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent],
  templateUrl: './vendor-resources.component.html',
  styleUrls: ['./vendor-resources.component.scss']
})
export class VendorResourcesComponent implements OnInit {
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
  @Output() applicationCountClick = new EventEmitter<string>();
  @Output() matchingCountClick = new EventEmitter<string>();

  // AG Grid API reference
  private gridApi: any;

  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Resource', 
      field: 'name', 
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const resource = params.data;
        const categoryName = resource.category?.name || 'N/A';
        return `
          <div class="flex items-center justify-start text-left">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900 truncate">${resource.name || 'N/A'}</div>
              <div class="text-xs text-gray-500 truncate">${categoryName}</div>
            </div>
          </div>
        `;
      }
    },
    { 
      headerName: 'Skills', 
      field: 'skills', 
      flex: 1,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        return skills.length > 0 ? skills[0]?.name || '' : '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">No skills</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: any) => {
          const skillName = skill?.name || 'Unknown';
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">${skillName}</span>`;
        });
        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    { 
      headerName: 'Experience', 
      field: 'experience.years', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const experience = params.data.experience || {};
        return `
          <div class="text-left">
            <div class="text-sm text-gray-900">${experience.years || 0} years</div>
            <div class="text-xs text-gray-500">${experience.level || 'Not specified'}</div>
          </div>
        `;
      }
    },
    { 
      headerName: 'Rate', 
      field: 'rate.hourly', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const rate = params.data.rate || {};
        return `
          <div class="text-left">
            <div class="text-sm text-gray-900">$${rate.hourly || 0}/hr</div>
            <div class="text-xs text-gray-500">${rate.currency || 'USD'}</div>
          </div>
        `;
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
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        `;
      }
    },
    {
      headerName: 'Attachment',
      field: 'attachment',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const attachment = params.data.attachment;
        if (!attachment || !attachment.originalName) {
          return '<span class="text-xs text-gray-500 italic">No file</span>';
        }
        
        return `
          <div class="flex items-center justify-center">
            <button 
              class="download-btn p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              id="download-${params.data._id}"
              title="${attachment.originalName}">
              <img src="assets/icons/lucide/lucide/file-text.svg" alt="file" class="w-4 h-4" />
            </button>
          </div>
        `;
      }
    },
    {
      headerName: 'Applications',
      field: 'applicationCount',
      flex: 1,
      minWidth: 100,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.applicationCount || 0;
        const resourceId = params.data._id;
        const countClass = count > 0 ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' : 'bg-gray-100 text-gray-600';
        
        return `
          <div class="flex items-center justify-start">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} transition-colors"
                  id="app-count-${resourceId}">
              ${count}
            </span>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const count = params.data.applicationCount || 0;
        if (count > 0) {
          this.onApplicationCountClick(params.data._id);
        }
      }
    },
    {
      headerName: 'Matching',
      field: 'matchingCount',
      flex: 1,
      minWidth: 100,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.matchingCount || 0;
        const resourceId = params.data._id;
        const countClass = count > 0 ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer' : 'bg-gray-100 text-gray-600';
        
        return `
          <div class="flex items-center justify-start">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} transition-colors"
                  id="matching-count-${resourceId}">
              ${count}
            </span>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const count = params.data.matchingCount || 0;
        if (count > 0) {
          this.onMatchingCountClick(params.data._id);
        }
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      minWidth: 150,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const isActive = this.isResourceActive(resource);
        const toggleText = this.getToggleButtonText(resource);
        const toggleClass = this.getToggleButtonClass(resource);
        
        return `
          <div class="flex items-center justify-start space-x-2">
            <button 
              class="edit-btn text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              id="edit-${resource._id}">
              Edit
            </button>
            <button 
              class="toggle-btn text-xs px-3 py-1 rounded transition-colors ${toggleClass}"
              id="toggle-${resource._id}">
              ${toggleText}
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const resource = params.data;
        
        if (target.classList.contains('edit-btn')) {
          this.onEditResource(resource);
        } else if (target.classList.contains('toggle-btn')) {
          this.onToggleResourceStatus(resource);
        }
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

  constructor(private vendorService: VendorService, private apiService: ApiService) {}

  ngOnInit(): void {
    console.log('🔧 VendorResourcesComponent: ngOnInit called');
  }

  ngOnChanges(): void {
    // This will be called whenever the @Input properties change
    console.log('🔧 VendorResources: Resources data changed:', this.resources);
    
    // Force grid refresh if needed
    if (this.gridApi) {
      this.gridApi.setRowData(this.resources);
    }
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    console.log('🔧 VendorResources: Grid ready, API captured');
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

  downloadAttachment(resource: Resource): void {
    if (!resource.attachment || !resource.attachment.fileId) {
      console.error('No attachment found for resource:', resource._id);
      return;
    }

    this.apiService.downloadFile(resource.attachment.fileId).subscribe(
      (response: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = resource.attachment!.originalName;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      (error) => {
        console.error('Error downloading file:', error);
      }
    );
  }

  onApplicationCountClick(resourceId: string): void {
    console.log('🔧 VendorResources: Application count clicked for resource:', resourceId);
    this.applicationCountClick.emit(resourceId);
  }

  onMatchingCountClick(resourceId: string): void {
    console.log('🔧 VendorResources: Matching count clicked for resource:', resourceId);
    this.matchingCountClick.emit(resourceId);
  }
} 