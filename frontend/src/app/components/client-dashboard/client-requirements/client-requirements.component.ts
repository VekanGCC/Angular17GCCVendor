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
  @Output() viewApplications = new EventEmitter<string>();
  @Output() viewMatchingResources = new EventEmitter<string>();

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
        if (skills.length === 0) return '';
        
        // Handle both populated objects and ObjectIds
        const firstSkill = skills[0];
        if (typeof firstSkill === 'object' && firstSkill.name) {
          return firstSkill.name;
        } else if (typeof firstSkill === 'string') {
          return firstSkill; // Return ObjectId as fallback
        }
        return '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">None</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: any) => {
          let skillName = 'Unknown';
          
          // Handle both populated objects and ObjectIds
          if (typeof skill === 'object' && skill.name) {
            skillName = skill.name;
          } else if (typeof skill === 'string') {
            skillName = skill; // Use ObjectId as fallback
          }
          
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
      headerName: 'Category',
      field: 'category',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        let categoryName = 'N/A';
        
        // Handle both populated objects and ObjectIds
        if (typeof params.data.category === 'object' && params.data.category.name) {
          categoryName = params.data.category.name;
        } else if (typeof params.data.category === 'string') {
          categoryName = params.data.category; // Use ObjectId as fallback
        }
        
        return `<span class="text-sm text-gray-900">${categoryName}</span>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.minYears',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const experience = params.data.experience || {};
        return `
          <div class="text-left">
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
      headerName: 'Applications',
      field: 'applicationCount',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.applicationCount || 0;
        const countClass = count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
        const cursorClass = count > 0 ? 'cursor-pointer hover:bg-blue-200' : 'cursor-default';
        
        const button = document.createElement('button');
        button.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} ${cursorClass} transition-colors`;
        button.innerHTML = `${count}`;
        button.id = `app-count-${params.data._id}`;
        button.title = count > 0 ? `View ${count} application(s) for this requirement` : 'No applications';
        
        // Add click event listener if there are applications
        if (count > 0) {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.viewApplications.emit(params.data._id);
          });
        }
        
        return button;
      }
    },
    {
      headerName: 'Matching Resources',
      field: 'matchingResourcesCount',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.matchingResourcesCount || 0;
        const countClass = count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
        const cursorClass = count > 0 ? 'cursor-pointer hover:bg-green-200' : 'cursor-default';
        
        const button = document.createElement('button');
        button.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} ${cursorClass} transition-colors`;
        button.innerHTML = `${count}`;
        button.id = `resource-count-${params.data._id}`;
        button.title = count > 0 ? `View ${count} matching resource(s) for this requirement` : 'No matching resources';
        
        // Add click event listener if there are matching resources
        if (count > 0) {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.viewMatchingResources.emit(params.data._id);
          });
        }
        
        return button;
      }
    },
    {
      headerName: 'Posted',
      field: 'createdAt',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
        const requirement = params.data;
        const attachment = requirement.attachment;
        
        if (!attachment || !attachment.originalName) {
          return '<span class="text-xs text-gray-500 italic">No file</span>';
        }
        
        const button = document.createElement('button');
        button.className = 'download-btn p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors';
        button.innerHTML = `
          <img src="assets/icons/lucide/lucide/file-text.svg" class="w-4 h-4" alt="file">
        `;
        button.id = `download-${requirement._id}`;
        button.title = `Download ${attachment.originalName}`;
        
        // Add click event listener
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          this.downloadAttachment(requirement);
        });
        
        return button;
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
        let html = '<div class="flex space-x-2 justify-start">';
        
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
        `;
        
        html += '</div>';
        
        // Add event listeners after rendering
        setTimeout(() => {
          const closeBtn = document.getElementById(`close-${requirement._id}`);
          const editBtn = document.getElementById(`edit-${requirement._id}`);
          
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
    console.log('🔧 ClientRequirementsComponent: Downloading attachment:', requirement.attachment);
    
    if (!requirement.attachment || !requirement.attachment.fileId) {
      console.error('🔧 ClientRequirementsComponent: No file ID found for download');
      return;
    }

    // Use the API service to download the file
    this.apiService.downloadFile(requirement.attachment.fileId).subscribe({
      next: (response: Blob) => {
        console.log('🔧 ClientRequirementsComponent: File download successful');
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = requirement.attachment!.originalName || 'download';
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      },
      error: (error: any) => {
        console.error('🔧 ClientRequirementsComponent: File download error:', error);
        // Handle download error - could show a toast notification here
      }
    });
  }
} 