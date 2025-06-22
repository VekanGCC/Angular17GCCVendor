import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Requirement } from '../../../models/requirement.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ClientService } from '../../../services/client.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-requirements',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './client-requirements.component.html',
  styleUrls: ['./client-requirements.component.scss']
})
export class ClientRequirementsComponent implements OnInit, OnChanges {
  @Input() requirements: Requirement[] = [];
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
  @Output() openRequirementModal = new EventEmitter<void>();
  @Output() openCloseRequirementModal = new EventEmitter<Requirement>();
  @Output() openEditRequirementModal = new EventEmitter<Requirement>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();

  columnDefs: ColDef[] = [
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        return `
          <div class="flex items-center justify-start text-left">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900 truncate">${requirement.title || 'No Title'}</div>
              <div class="text-xs text-gray-500 truncate">${requirement.description || 'No Description'}</div>
            </div>
          </div>
        `;
      }
    },
    {
      headerName: 'Skills',
      field: 'skills',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        return skills.length > 0 ? skills[0] : '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">None</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: string) => {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">${skill}</span>`;
        });
        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    {
      headerName: 'Category',
      field: 'category',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        return `<span class="text-sm text-gray-900">${params.value || 'N/A'}</span>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.minYears',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const experience = params.data.experience || {};
        return `
          <div>
            <div class="text-sm text-gray-900">${experience.minYears || 0} years</div>
            <div class="text-xs text-gray-500">${experience.level || 'Not specified'}</div>
          </div>
        `;
      }
    },
    {
      headerName: 'Location',
      field: 'location.city',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const location = params.data.location;
        if (!location) return '<span class="text-sm text-gray-500">N/A</span>';
        
        const city = location.city || 'N/A';
        const state = location.state || 'N/A';
        const remote = location.remote;
        
        let html = `<div class="flex flex-col items-start text-left">`;
        html += `<span class="text-sm text-gray-900">${city}, ${state}</span>`;
        if (remote) {
          html += `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full w-fit">Remote</span>`;
        }
        html += `</div>`;
        return html;
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const status = params.data.status || 'unknown';
        const statusClass = this.getStatusClass(status);
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${status}</span>`;
      }
    },
    {
      headerName: 'Posted',
      field: 'createdAt',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const date = new Date(params.value);
        return `<span class="text-sm text-gray-500">${date.toLocaleDateString()}</span>`;
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
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        let html = '<div class="flex space-x-2">';
        
        if (['open', 'in_progress', 'on_hold', 'draft'].includes(requirement.status)) {
          html += `
            <button 
              class="close-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all duration-200"
              id="close-${requirement._id}">
              Close
            </button>
          `;
        }
        
        html += `
          <button 
            class="edit-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200"
            id="edit-${requirement._id}">
            Edit
          </button>
        </div>`;
        
        // Add event listeners after rendering
        setTimeout(() => {
          const closeBtn = document.getElementById(`close-${requirement._id}`);
          const editBtn = document.getElementById(`edit-${requirement._id}`);
          const downloadBtn = document.getElementById(`download-${requirement._id}`);
          
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              console.log('🔍 DEBUG: Close button clicked for requirement:', requirement._id);
              this.onOpenCloseRequirementModal(requirement);
              // Force change detection to ensure modal opens immediately
              this.changeDetectorRef.detectChanges();
            });
          }
          
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              this.onOpenEditRequirementModal(requirement);
              // Force change detection to ensure modal opens immediately
              this.changeDetectorRef.detectChanges();
            });
          }
          
          if (downloadBtn && requirement.attachment) {
            downloadBtn.addEventListener('click', () => {
              console.log('🔍 DEBUG: Download button clicked for requirement:', requirement._id);
              this.downloadAttachment(requirement);
            });
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

  constructor(private changeDetectorRef: ChangeDetectorRef, private clientService: ClientService, private apiService: ApiService) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requirements'] && !changes['requirements'].firstChange) {
      // Update pagination state when requirements change
      this.updatePaginationState();
    }
  }

  updatePaginationState(): void {
    // This will be called by parent component when pagination data is available
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('Sort changed:', sort);
      
      // Map AG Grid field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        'title': 'title',
        'skills': 'skills',
        'category': 'category',
        'experience.minYears': 'experience.minYears',
        'location.city': 'location.city',
        'status': 'status',
        'createdAt': 'createdAt'
      };
      
      const sortBy = fieldMapping[sort.colId] || sort.colId;
      const sortOrder = sort.sort as 'asc' | 'desc';
      
      this.sortChange.emit({ sortBy, sortOrder });
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onOpenRequirementModal(): void {
    this.openRequirementModal.emit();
    // Force change detection to ensure modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  onOpenCloseRequirementModal(requirement: Requirement): void {
    console.log('🔍 DEBUG: Opening close requirement modal for:', requirement._id);
    this.openCloseRequirementModal.emit(requirement);
    // Force change detection to ensure modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  onOpenEditRequirementModal(requirement: Requirement): void {
    this.openEditRequirementModal.emit(requirement);
  }

  downloadAttachment(requirement: Requirement): void {
    if (!requirement.attachment || !requirement.attachment.fileId) {
      console.error('No attachment found for requirement:', requirement._id);
      return;
    }

    this.apiService.downloadFile(requirement.attachment.fileId).subscribe(
      (response: Blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(response);
        link.download = requirement.attachment!.originalName;
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
} 