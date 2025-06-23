// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';
import { Requirement } from '../../../models/requirement.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin-skill.model';

@Component({
  selector: 'app-vendor-requirements',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './vendor-requirements.component.html',
  styleUrls: ['./vendor-requirements.component.scss']
})
export class VendorRequirementsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() requirements: Requirement[] = [];
  @Input() isLoading = false;
  @Input() paginationState!: PaginationState;
  @Output() applyResources = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: 'asc' | 'desc'}>();

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    filter: 'assets/icons/lucide/lucide/filter.svg',
    x: 'assets/icons/lucide/lucide/x.svg',
    chevronDown: 'assets/icons/lucide/lucide/chevron-down.svg'
  };

  showFilters = false;
  showSkillsDropdown = false;
  availableSkills: AdminSkill[] = [];

  // Search and filter properties
  searchTerm = '';
  selectedSkills: string[] = [];
  skillLogic: 'AND' | 'OR' = 'OR';
  minBudget = '';
  maxBudget = '';
  minDuration = '';
  maxDuration = '';

  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Opportunity', 
      field: 'title', 
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
   /* { 
      headerName: 'Skills', 
      field: 'skills', 
      flex: 1,
      sortable: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: string) => {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">${skill}</span>`;
        });
        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }
        html += '</div>';
        return html;
      }
    },*/ {
  headerName: 'Skills', 
  field: 'skills', 
  flex: 1,
  sortable: false,
  filter: false,
  cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  valueGetter: (params: any) => {
    const skills = params.data.skills || [];
    return skills.length > 0 ? skills[0].name : '';
  },
  cellRenderer: (params: any) => {
    const skills = params.data.skills || [];
    if (skills.length === 0) {
      return '<span class="text-xs text-gray-500 italic">None</span>';
    }

    const displaySkills = skills.slice(0, 2); // Show only first 2
    const remainingCount = skills.length - 2;

    let html = '<div class="flex flex-wrap gap-1 items-center">';
    displaySkills.forEach((skill: any) => {
      html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">${skill.name}</span>`;
    });

    if (remainingCount > 0) {
      html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
    }

    html += '</div>';
    return html;
  }
}
,
    { 
      headerName: 'Budget', 
      field: 'budget.charge', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const budgetDisplay = this.getBudgetDisplay(params.data);
        return `<span class="text-sm text-gray-900">${budgetDisplay}</span>`;
      }
    },
    { 
      headerName: 'Duration', 
      field: 'duration', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const duration = this.getDurationDisplay(params.data);
        return `<div class="text-sm text-gray-900">${duration}</div>`;
      }
    },
    { 
      headerName: 'Location', 
      field: 'location.city', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const location = this.getLocationDisplay(params.data);
        const isRemote = params.data.location?.remote;
        
        let html = `<div class="flex flex-col items-start text-left">`;
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const requirement = params.data;
        
        const html = `
          <div class="flex justify-start">
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

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    console.log('🔧 VendorRequirementsComponent: Constructor called');
  }

  ngOnInit(): void {
    console.log('🔧 VendorRequirementsComponent: ngOnInit called');
    console.log('🔧 VendorRequirementsComponent: Requirements data:', this.requirements);
    this.loadAvailableSkills();
    this.setupClickOutsideHandler();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requirements']) {
      console.log('🔧 VendorRequirementsComponent: Requirements changed:', this.requirements);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside);
  }

  private handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.skills-dropdown-container')) {
      this.showSkillsDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  };

  private setupClickOutsideHandler(): void {
    document.addEventListener('click', this.handleClickOutside);
  }

  private loadAvailableSkills(): void {
    this.apiService.getActiveSkills().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSkills = (response.data as any[]).map(skill => ({
            ...skill,
            _id: skill._id || skill.id || skill.name // fallback if needed
          }));
          console.log('🔧 VendorRequirementsComponent: Loaded skills:', this.availableSkills);
        }
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      }
    });
  }

  onSearchChange(): void {
    this.emitSearchChange();
  }

  onSkillsChange(): void {
    this.emitSearchChange();
  }

  onBudgetChange(): void {
    this.emitSearchChange();
  }

  onDurationChange(): void {
    this.emitSearchChange();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.changeDetectorRef.detectChanges();
  }

  toggleSkillsDropdown(): void {
    this.showSkillsDropdown = !this.showSkillsDropdown;
    this.changeDetectorRef.detectChanges();
  }

  toggleSkill(skillName: string): void {
    const index = this.selectedSkills.indexOf(skillName);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skillName);
    }
    this.onSkillsChange();
    this.changeDetectorRef.detectChanges();
  }

  isSkillSelected(skillName: string): boolean {
    return this.selectedSkills.includes(skillName);
  }

  isAllSkillsSelected(): boolean {
    return this.availableSkills.length > 0 && this.selectedSkills.length === this.availableSkills.length;
  }

  toggleAllSkills(): void {
    if (this.isAllSkillsSelected()) {
      this.selectedSkills = [];
    } else {
      this.selectedSkills = this.availableSkills.map(skill => skill.name);
    }
    this.onSkillsChange();
    this.changeDetectorRef.detectChanges();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSkills = [];
    this.minBudget = '';
    this.maxBudget = '';
    this.minDuration = '';
    this.maxDuration = '';
    this.emitSearchChange();
    this.changeDetectorRef.detectChanges();
  }

  removeSearchTerm(): void {
    this.searchTerm = '';
    this.emitSearchChange();
  }

  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    this.emitSearchChange();
  }

  removeBudgetFilter(): void {
    this.minBudget = '';
    this.maxBudget = '';
    this.emitSearchChange();
  }

  removeDurationFilter(): void {
    this.minDuration = '';
    this.maxDuration = '';
    this.emitSearchChange();
  }

  private emitSearchChange(): void {
    const searchParams: any = {};

    if (this.searchTerm.trim()) {
      searchParams.search = this.searchTerm.trim();
    }

    if (this.selectedSkills.length > 0) {
      searchParams.skills = this.selectedSkills;
      searchParams.skillLogic = this.skillLogic;
    }

    if (this.minBudget || this.maxBudget) {
      searchParams.minBudget = this.minBudget;
      searchParams.maxBudget = this.maxBudget;
    }

    if (this.minDuration || this.maxDuration) {
      searchParams.minDuration = this.minDuration;
      searchParams.maxDuration = this.maxDuration;
    }

    console.log('🔧 VendorRequirementsComponent: Emitting search change:', searchParams);
    // Note: We'll need to implement the search functionality in the parent component
    // For now, we'll just log the search parameters
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm.trim() ||
      this.selectedSkills.length > 0 ||
      this.minBudget ||
      this.maxBudget ||
      this.minDuration ||
      this.maxDuration
    );
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel.length > 0) {
      const sort = sortModel[0];
      this.sortChange.emit({
        sortBy: sort.colId,
        sortOrder: sort.sort || 'asc'
      });
    }
  }

  getBudgetDisplay(req: Requirement): string {
    if (!req.budget) return 'N/A';
    
    const charge = req.budget.charge || 0;
    const currency = req.budget.currency || 'USD';
    const type = req.budget.type || 'hourly';
    
    if (type === 'hourly') {
      return `${currency}${charge}/hr`;
    } else if (type === 'fixed') {
      return `${currency}${charge}`;
    } else {
      return `${currency}${charge}/${type}`;
    }
  }

  getDurationDisplay(req: Requirement): string {
    if (!req.duration) return 'N/A';
    return req.duration;
  }

  getLocationDisplay(req: Requirement): string {
    if (!req.location) return 'N/A';
    
    const city = req.location.city || '';
    const state = req.location.state || '';
    const country = req.location.country || '';
    
    if (city && state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    } else if (country) {
      return country;
    }
    
    return 'N/A';
  }

  onApplyResources(requirementId: string): void {
    this.applyResources.emit(requirementId);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  trackById(index: number, item: Requirement): string {
    return item._id;
  }

  trackBySkill(index: number, skill: string): string {
    return skill;
  }
} 