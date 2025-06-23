import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Resource } from '../../../models/resource.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin-skill.model';

@Component({
  selector: 'app-client-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './client-resources.component.html',
  styleUrls: ['./client-resources.component.scss']
})
export class ClientResourcesComponent implements OnInit, OnChanges, OnDestroy {
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
  @Output() searchChange = new EventEmitter<any>();

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    users: 'assets/icons/lucide/lucide/users.svg',
    filter: 'assets/icons/lucide/lucide/filter.svg',
    x: 'assets/icons/lucide/lucide/x.svg',
    chevronDown: 'assets/icons/lucide/lucide/chevron-down.svg',
    download: 'assets/icons/lucide/lucide/download.svg'
  };

  showFilters = false;
  showSkillsDropdown = false;
  availableSkills: AdminSkill[] = [];

  // Search and filter properties
  searchTerm = '';
  selectedSkillIds: string[] = [];
  skillLogic: 'AND' | 'OR' = 'OR';
  minExperience = '';
  maxExperience = '';
  minRate = '';
  maxRate = '';

  // Experience levels for dropdown
  experienceLevels = [
    'entry',
    'junior',
    'mid',
    'senior',
    'lead',
    'principal'
  ];

  columnDefs: ColDef[] = [
    {
      headerName: 'Resource',
      field: 'name',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      headerName: 'Attachment',
      field: 'attachment',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const attachment = resource.attachment;
        
        if (!attachment) {
          return '<span class="text-xs text-gray-500 italic">-</span>';
        }
        
        const button = document.createElement('button');
        button.className = 'download-btn p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors';
        button.innerHTML = `
          <img src="assets/icons/lucide/lucide/file-text.svg" class="w-4 h-4" alt="file">
        `;
        button.id = `download-${resource._id}`;
        button.title = `Download ${attachment.originalName || 'file'}`;
        
        // Add click event listener
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          this.downloadResourceAttachment(attachment);
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
    this.loadAvailableSkills();
    this.setupClickOutsideHandler();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes if needed
  }

  ngOnDestroy(): void {
    // Clean up click outside handler
    document.removeEventListener('click', this.handleClickOutside);
  }

  private handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    const skillsDropdown = document.querySelector('.skills-dropdown-container');
    
    if (skillsDropdown && !skillsDropdown.contains(target)) {
      this.showSkillsDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  };

  private setupClickOutsideHandler(): void {
    document.addEventListener('click', this.handleClickOutside);
  }

  // Load available skills for the skills filter
  private loadAvailableSkills(): void {
    this.apiService.get<any>('/skills/active').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSkills = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      }
    });
  }

  // Search and filter methods
  onSearchChange(): void {
    this.emitSearchChange();
  }

  onSkillsChange(): void {
    this.emitSearchChange();
  }

  onExperienceChange(): void {
    this.emitSearchChange();
  }

  onRateChange(): void {
    this.emitSearchChange();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Skills dropdown methods
  toggleSkillsDropdown(): void {
    this.showSkillsDropdown = !this.showSkillsDropdown;
  }

  toggleSkill(skillId: string): void {
    const index = this.selectedSkillIds.indexOf(skillId);
    if (index > -1) {
      this.selectedSkillIds.splice(index, 1);
    } else {
      this.selectedSkillIds.push(skillId);
    }
    this.onSkillsChange();
  }

  isSkillSelected(skillId: string): boolean {
    return this.selectedSkillIds.includes(skillId);
  }

  isAllSkillsSelected(): boolean {
    return this.availableSkills.length > 0 && this.selectedSkillIds.length === this.availableSkills.length;
  }

  toggleAllSkills(): void {
    if (this.isAllSkillsSelected()) {
      this.selectedSkillIds = [];
    } else {
      this.selectedSkillIds = this.availableSkills.map(skill => skill._id);
    }
    this.onSkillsChange();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSkillIds = [];
    this.minExperience = '';
    this.maxExperience = '';
    this.minRate = '';
    this.maxRate = '';
    this.emitSearchChange();
  }

  // Individual filter removal methods
  removeSearchTerm(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  removeSkill(skillId: string): void {
    this.selectedSkillIds = this.selectedSkillIds.filter(s => s !== skillId);
    this.onSkillsChange();
  }

  removeExperienceFilter(): void {
    this.minExperience = '';
    this.maxExperience = '';
    this.onExperienceChange();
  }

  removeRateFilter(): void {
    this.minRate = '';
    this.maxRate = '';
    this.onRateChange();
  }

  // Helper method to get skill name by ID
  getSkillNameById(skillId: string): string {
    const skill = this.availableSkills.find(s => s._id === skillId);
    return skill ? skill.name : skillId;
  }

  private emitSearchChange(): void {
    const searchParams: { [key: string]: string | string[] | undefined } = {
      search: this.searchTerm,
      minExperience: this.minExperience || undefined,
      maxExperience: this.maxExperience || undefined,
      minRate: this.minRate || undefined,
      maxRate: this.maxRate || undefined
    };

    // Handle skills parameter - send as array of IDs
    if (this.selectedSkillIds.length > 0) {
      searchParams['skills'] = this.selectedSkillIds;
      searchParams['skillLogic'] = this.skillLogic;
    }

    // Remove undefined values
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] === undefined) {
        delete searchParams[key];
      }
    });

    console.log('🔧 ClientResourcesComponent: Emitting search change with params:', searchParams);
    this.searchChange.emit(searchParams);
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedSkillIds.length > 0 ||
      this.minExperience ||
      this.maxExperience ||
      this.minRate ||
      this.maxRate
    );
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
    console.log('🔧 ClientResourcesComponent: Applying resource:', resourceId);
    this.applyResources.emit([resourceId]);
  }

  downloadResourceAttachment(attachment: any): void {
    console.log('🔧 ClientResourcesComponent: Downloading attachment:', attachment);
    
    if (!attachment || !attachment.fileId) {
      console.error('🔧 ClientResourcesComponent: No file ID found for download');
      return;
    }

    // Use the API service to download the file
    this.apiService.downloadFile(attachment.fileId).subscribe({
      next: (response: Blob) => {
        console.log('🔧 ClientResourcesComponent: File download successful');
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = attachment.originalName || 'download';
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      },
      error: (error: any) => {
        console.error('🔧 ClientResourcesComponent: File download error:', error);
        // Handle download error - could show a toast notification here
      }
    });
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
  }

  onCellClicked(params: any): void {
    // Handle apply button clicks
    if (params.column.colId === 'actions') {
      const resourceId = params.data._id;
      this.onApplyResource(resourceId);
    }
    
    // Handle attachment clicks (though the button has its own listener, this provides fallback)
    if (params.column.colId === 'attachment') {
      const resource = params.data;
      const attachment = resource.attachment;
      if (attachment && attachment.fileId) {
        this.downloadResourceAttachment(attachment);
      }
    }
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}