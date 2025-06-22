import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Resource } from '../../../models/resource.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-resources',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './client-resources.component.html',
  styleUrls: ['./client-resources.component.scss']
})
export class ClientResourcesComponent implements OnInit, OnChanges {
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
  @Output() applyResources = new EventEmitter<string[]>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();
  @Output() pageChange = new EventEmitter<number>();

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    users: 'assets/icons/lucide/lucide/users.svg'
  };

  selectedResources: Set<string> = new Set();
  showApplyButton = false;

  columnDefs: ColDef[] = [
    {
      headerName: 'Select',
      field: 'select',
      flex: 0.5,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const isSelected = this.selectedResources.has(resource._id);
        return `
          <input 
            type="checkbox" 
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            ${isSelected ? 'checked' : ''}
            id="select-${resource._id}"
          >
        `;
      }
    },
    {
      headerName: 'Resource',
      field: 'name',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        return `
          <div class="flex items-center justify-start text-left">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900 truncate">${resource.name || 'N/A'}</div>
              <div class="text-xs text-gray-500 truncate">${resource.category || 'N/A'}</div>
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
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">No skills</span>';
        
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
      headerName: 'Experience',
      field: 'experience.years',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      headerName: 'Location',
      field: 'location.city',
      flex: 1.5,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const location = params.data.location;
        if (!location) return '<span class="text-sm text-gray-500">N/A</span>';
        
        const city = location.city || 'N/A';
        const state = location.state || 'N/A';
        const remote = location.remote;
        
        let html = `<div class="flex flex-col"><span class="text-sm text-gray-900">${city}, ${state}</span>`;
        if (remote) {
          html += `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full w-fit">Remote</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    {
      headerName: 'Availability',
      field: 'availability.status',
      flex: 1.5,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const availability = params.data.availability || {};
        const status = availability.status || 'Unknown';
        const hours = availability.hours_per_week || 0;
        const statusClass = this.getAvailabilityClass(status);
        return `
          <div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${status}</span>
            <div class="text-xs text-gray-500 mt-1">${hours} hrs/week</div>
          </div>
        `;
      }
    },
    {
      headerName: 'Rate',
      field: 'rate.hourly',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const button = document.createElement('button');
        button.className = 'apply-btn inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200';
        button.textContent = 'Apply';
        button.id = `apply-${resource._id}`;
        
        // Add click event listener
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          this.onApplyResource(resource._id);
        });
        
        return button;
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

  constructor(private changeDetectorRef: ChangeDetectorRef, private apiService: ApiService) {}

  // Add Math for template access
  Math = Math;

  ngOnInit(): void {
    console.log('🔧 ClientResourcesComponent: ngOnInit called');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔧 ClientResourcesComponent: ngOnChanges called');
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 ClientResourcesComponent: Sort changed:', sort);
      
      // Map AG Grid field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        'name': 'name',
        'skills': 'skills',
        'experience.years': 'experience.years',
        'rate.hourly': 'rate.hourly',
        'availability.status': 'availability.status',
        'location.city': 'location.city',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt'
      };
      
      const sortBy = fieldMapping[sort.colId] || sort.colId;
      const sortOrder = sort.sort as 'asc' | 'desc';
      
      this.sortChange.emit({ sortBy, sortOrder });
    }
  }

  onApplyResource(resourceId: string): void {
    console.log('🔧 ClientResourcesComponent: Apply button clicked for resource:', resourceId);
    // Single resource apply (keeping backward compatibility)
    this.applyResources.emit([resourceId]);
  }

  onApplySelectedResources(): void {
    // Multi-resource apply
    const selectedResourceIds = Array.from(this.selectedResources);
    this.applyResources.emit(selectedResourceIds);
  }

  toggleResourceSelection(resourceId: string): void {
    if (this.selectedResources.has(resourceId)) {
      this.selectedResources.delete(resourceId);
    } else {
      this.selectedResources.add(resourceId);
    }
    this.showApplyButton = this.selectedResources.size > 0;
    this.changeDetectorRef.detectChanges();
  }

  isResourceSelected(resourceId: string): boolean {
    return this.selectedResources.has(resourceId);
  }

  getSelectedCount(): number {
    return this.selectedResources.size;
  }

  clearSelection(): void {
    this.selectedResources.clear();
    this.showApplyButton = false;
    this.changeDetectorRef.detectChanges();
  }

  getAvailabilityClass(status: string): string {
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

  trackById(index: number, item: Resource): string {
    return item._id || `resource-${index}`;
  }

  onGridReady(params: any): void {
    console.log('🔧 ClientResourcesComponent: Grid ready');
    // Add event listeners for checkboxes and apply buttons
    setTimeout(() => {
      this.addEventListeners();
    });
  }

  onCellClicked(params: any): void {
    // Handle checkbox clicks
    if (params.column.colId === 'select') {
      const resourceId = params.data._id;
      this.toggleResourceSelection(resourceId);
    }
    
    // Handle apply button clicks
    if (params.column.colId === 'actions') {
      const resourceId = params.data._id;
      this.onApplyResource(resourceId);
    }
  }

  addEventListeners(): void {
    // Add event listeners for checkboxes and apply buttons
    setTimeout(() => {
      this.selectedResources.forEach(resourceId => {
        const checkbox = document.getElementById(`select-${resourceId}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.addEventListener('change', (event) => {
            const isChecked = (event.target as HTMLInputElement).checked;
            if (isChecked) {
              this.selectedResources.add(resourceId);
            } else {
              this.selectedResources.delete(resourceId);
            }
            this.showApplyButton = this.selectedResources.size > 0;
            this.changeDetectorRef.detectChanges();
          });
        }
      });
    });
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}