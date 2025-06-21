// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';
import { Requirement } from '../../../models/requirement.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-vendor-requirements',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent],
  templateUrl: './vendor-requirements.component.html',
  styleUrls: ['./vendor-requirements.component.scss']
})
export class VendorRequirementsComponent implements OnInit {
  @Input() requirements: Requirement[] = [];
  @Input() isLoading = false;
  @Input() paginationState!: PaginationState;
  @Output() applyResources = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();

  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Opportunity', 
      field: 'title', 
      flex: 2,
      sortable: true,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        return `
          <div class="flex items-center">
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
      sortable: true, // Enable sorting
      valueGetter: (params: any) => {
        // Sort by the first skill in the array
        const skills = params.data.skills || [];
        return skills.length > 0 ? skills[0] : '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">None</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1">';
        displaySkills.forEach((skill: string) => {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">${skill}</span>`;
        });
        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    { 
      headerName: 'Budget', 
      field: 'budget.amount', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const budget = this.getBudgetDisplay(params.data);
        return `<div class="text-sm text-gray-900">${budget}</div>`;
      }
    },
    { 
      headerName: 'Duration', 
      field: 'duration', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const duration = this.getDurationDisplay(params.data);
        return `<div class="text-sm text-gray-900">${duration}</div>`;
      }
    },
    { 
      headerName: 'Location', 
      field: 'location.city', 
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        const location = this.getLocationDisplay(params.data);
        const isRemote = params.data.location?.remote;
        
        let html = `<div class="flex flex-col">`;
        html += `<span class="text-sm text-gray-900">${location}</span>`;
        if (isRemote) {
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
      sortable: true,
      cellRenderer: (params: any) => {
        const status = params.data.status || 'unknown';
        return `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ${status}
          </span>
        `;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        
        const html = `
          <div class="flex justify-end">
            <button 
              class="apply-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 transition-all duration-200"
              id="apply-${requirement._id}">
              <span class="mr-1">📋</span>
              Apply
            </button>
          </div>
        `;
        
        // Add event listeners after rendering
        setTimeout(() => {
          const applyBtn = document.getElementById(`apply-${requirement._id}`);
          
          if (applyBtn) {
            applyBtn.addEventListener('click', () => this.onApplyResources(requirement._id));
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
    rowHeight: 60,
    tooltipShowDelay: 500,
    onSortChanged: (event: SortChangedEvent) => {
      this.onSortChanged(event);
    }
  };

  constructor() {
    console.log('🔧 VendorRequirementsComponent: Constructor called');
  }

  ngOnInit(): void {
    console.log('🔧 VendorRequirementsComponent: ngOnInit called');
    console.log('🔧 VendorRequirementsComponent: Requirements data:', this.requirements);
  }

  ngOnChanges(): void {
    console.log('🔧 VendorRequirementsComponent: ngOnChanges called');
    console.log('🔧 VendorRequirementsComponent: Requirements updated:', this.requirements);
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 VendorRequirementsComponent: Sort changed:', sort);
      
      // Map AG Grid field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        'title': 'title',
        'skills': 'skills',
        'budget.amount': 'budget.amount',
        'duration': 'duration',
        'location.city': 'location.city',
        'status': 'status',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt'
      };
      
      const sortBy = fieldMapping[sort.colId] || sort.colId;
      const sortOrder = sort.sort as 'asc' | 'desc';
      
      this.sortChange.emit({ sortBy, sortOrder });
    }
  }

  getBudgetDisplay(req: Requirement): string {
    if (!req?.budget) return 'Not specified';
    
    // Handle different budget formats
    if (typeof req.budget === 'number') {
      return `$${req.budget}/hr`;
    }
    
    if (typeof req.budget === 'object') {
      const budget = req.budget as any;
      const amount = budget.amount || budget.hourly || budget.value || 0;
      const currency = budget.currency || 'USD';
      const type = budget.type || 'hourly';
      return `${currency}${amount}/${type}`;
    }
    
    return 'Not specified';
  }

  getDurationDisplay(req: Requirement): string {
    if (!req?.duration) return 'Not specified';
    
    if (typeof req.duration === 'number') {
      return `${req.duration} months`;
    }
    
    if (typeof req.duration === 'string') {
      return req.duration;
    }
    
    return 'Not specified';
  }

  getLocationDisplay(req: Requirement): string {
    if (!req?.location) return 'Not specified';
    
    if (typeof req.location === 'string') {
      return req.location;
    }
    
    if (typeof req.location === 'object') {
      const location = req.location as any;
      const city = location.city || '';
      const state = location.state || '';
      const country = location.country || '';
      
      if (location.remote) {
        return 'Remote';
      }
      
      const parts = [city, state, country].filter(part => part && part.trim());
      return parts.length > 0 ? parts.join(', ') : 'Not specified';
    }
    
    return 'Not specified';
  }

  onApplyResources(requirementId: string): void {
    console.log('🔧 VendorRequirementsComponent: Apply button clicked for requirement:', requirementId);
    console.log('🔧 VendorRequirementsComponent: Emitting applyResources event with ID:', requirementId);
    this.applyResources.emit(requirementId);
    console.log('🔧 VendorRequirementsComponent: Event emitted successfully');
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  trackById(index: number, item: Requirement): string {
    return item._id || `requirement-${index}`;
  }

  trackBySkill(index: number, skill: string): string {
    return skill || `skill-${index}`;
  }
} 