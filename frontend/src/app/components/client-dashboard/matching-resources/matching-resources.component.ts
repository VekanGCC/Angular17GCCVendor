import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';

// Interfaces for API response data
interface MatchingResource {
  _id: string;
  name: string;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  skills: Array<{
    _id: string;
    name: string;
  }>;
  experience: {
    years: number;
    level: string;
  };
  availability: {
    status: string;
    hours_per_week?: number;
    start_date?: string;
  };
  rate: {
    hourly: number;
    currency: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    remote: boolean;
  };
  status: string;
  matchPercentage: number;
  matchingSkills: number;
  totalRequiredSkills: number;
  vendor?: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName: string;
  };
}

interface MatchingRequirement {
  _id: string;
  title: string;
  description: string;
  category?: {
    _id: string;
    name: string;
  };
  skills?: Array<{
    _id: string;
    name: string;
  }>;
  budget?: {
    charge: number;
    currency: string;
  };
  startDate?: string;
  experience?: {
    minYears: number;
    level: string;
  };
}

interface MatchingResourcesResponse {
  requirement: MatchingRequirement;
  matchingResources: MatchingResource[];
  totalCount: number;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  matchingCriteria: {
    minSkillsToMatch: number;
    maxBudget?: number;
    requiredStartDate?: string;
    minExperienceYears?: number;
  };
}

@Component({
  selector: 'app-matching-resources',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './matching-resources.component.html',
  styleUrls: ['./matching-resources.component.scss']
})
export class MatchingResourcesComponent implements OnInit, OnDestroy {
  @Input() requirementId: string = '';
  @Output() navigateBack = new EventEmitter<void>();

  isLoading = false;
  requirement: MatchingRequirement | null = null;
  matchingResources: MatchingResource[] = [];
  totalCount = 0;
  matchingCriteria: any = null;

  // AG Grid configuration
  columnDefs: ColDef<MatchingResource>[] = [
    {
      headerName: 'Match %',
      field: 'matchPercentage',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const percentage = params.value || 0;
        let colorClass = 'text-red-600';
        if (percentage >= 80) colorClass = 'text-green-600';
        else if (percentage >= 60) colorClass = 'text-yellow-600';
        
        return `<div class="flex items-center justify-center">
          <span class="font-semibold ${colorClass}">${percentage}%</span>
        </div>`;
      }
    },
    {
      headerName: 'Resource Name',
      field: 'name',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const name = params.data.name || '';
        return `<div class="flex items-center">
          <span class="font-medium text-gray-900">${name}</span>
        </div>`;
      }
    },
    {
      headerName: 'Vendor',
      field: 'vendor.organizationName',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const vendor = params.data.vendor;
        const orgName = vendor?.organizationName || 'N/A';
        return `<span class="text-sm text-gray-600">${orgName}</span>`;
      }
    },
    {
      headerName: 'Skills',
      field: 'skills',
      flex: 3,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        const matchingSkills = params.data.matchingSkills || 0;
        const totalRequired = params.data.totalRequiredSkills || 0;
        
        const skillTags = skills.slice(0, 3).map((skill: any) => 
          `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">${skill.name}</span>`
        ).join('');
        
        const matchInfo = `<span class="text-xs text-gray-500 ml-2">(${matchingSkills}/${totalRequired} skills match)</span>`;
        
        return `<div class="flex flex-wrap items-center">
          ${skillTags}
          ${matchInfo}
        </div>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.years',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const years = params.data.experience?.years || 0;
        const level = params.data.experience?.level || 'N/A';
        return `<div class="text-center">
          <div class="font-medium">${years} years</div>
          <div class="text-xs text-gray-500">${level}</div>
        </div>`;
      }
    },
    {
      headerName: 'Rate',
      field: 'rate.hourly',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const hourly = params.data.rate?.hourly || 0;
        const currency = params.data.rate?.currency || 'USD';
        return `<div class="text-center">
          <div class="font-medium">$${hourly}/hr</div>
          <div class="text-xs text-gray-500">${currency}</div>
        </div>`;
      }
    },
    {
      headerName: 'Availability',
      field: 'availability.status',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const status = params.data.availability?.status || 'N/A';
        let colorClass = 'bg-gray-100 text-gray-800';
        if (status === 'available') colorClass = 'bg-green-100 text-green-800';
        else if (status === 'partially_available') colorClass = 'bg-yellow-100 text-yellow-800';
        
        return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}">
          ${status.replace('_', ' ')}
        </span>`;
      }
    },
    {
      headerName: 'Actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const button = document.createElement('button');
        button.className = 'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        button.innerHTML = 'Apply';
        button.addEventListener('click', () => {
          this.onApplyResource.emit(params.data._id);
        });
        return button;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  gridOptions = {
    rowHeight: 80,
    headerHeight: 50,
    suppressRowClickSelection: true,
    suppressCellFocus: true
  };

  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() onApplyResource = new EventEmitter<string>();

  private subscriptions: Subscription[] = [];

  constructor(private clientService: ClientService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('🔧 MatchingResourcesComponent: ngOnInit called with requirementId:', this.requirementId);
    if (this.requirementId) {
      this.loadMatchingResources();
    } else {
      console.warn('🔧 MatchingResourcesComponent: No requirementId provided');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMatchingResources(): void {
    if (!this.requirementId) return;

    console.log('🔧 MatchingResourcesComponent: Loading matching resources for requirement:', this.requirementId, 'page:', this.paginationState.currentPage);
    this.isLoading = true;
    
    this.subscriptions.push(
      this.clientService.getMatchingResourcesDetails(
        this.requirementId, 
        this.paginationState.currentPage, 
        this.paginationState.pageSize
      ).subscribe({
        next: (response) => {
          console.log('🔧 MatchingResourcesComponent: API response received:', response);
          if (response.success && response.data) {
            const data: MatchingResourcesResponse = response.data;
            console.log('🔧 MatchingResourcesComponent: Parsed data:', data);
            
            this.requirement = data.requirement;
            this.matchingResources = data.matchingResources || [];
            this.totalCount = data.totalCount || 0;
            this.matchingCriteria = data.matchingCriteria;
            
            // Update pagination state from API response
            if (data.pagination) {
              this.paginationState.currentPage = data.pagination.currentPage;
              this.paginationState.pageSize = data.pagination.pageSize;
              this.paginationState.totalPages = data.pagination.totalPages;
              this.paginationState.hasNextPage = data.pagination.hasNextPage;
              this.paginationState.hasPreviousPage = data.pagination.hasPreviousPage;
              this.paginationState.totalItems = this.totalCount;
            } else {
              // Fallback pagination calculation
              this.paginationState.totalItems = this.totalCount;
              this.paginationState.totalPages = Math.ceil(this.totalCount / this.paginationState.pageSize);
              this.paginationState.hasNextPage = this.paginationState.currentPage < this.paginationState.totalPages;
              this.paginationState.hasPreviousPage = this.paginationState.currentPage > 1;
            }
            
            console.log('🔧 MatchingResourcesComponent: Updated component state:', {
              requirement: this.requirement,
              matchingResources: this.matchingResources,
              totalCount: this.totalCount,
              paginationState: this.paginationState,
              isLoading: this.isLoading
            });
            
            // Force change detection
            this.changeDetectorRef.detectChanges();
          } else {
            console.error('🔧 MatchingResourcesComponent: API response not successful:', response);
          }
        },
        error: (error) => {
          console.error('🔧 MatchingResourcesComponent: Error loading matching resources:', error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        complete: () => {
          console.log('🔧 MatchingResourcesComponent: Loading completed, setting isLoading to false');
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      })
    );
  }

  onBackClick(): void {
    this.navigateBack.emit();
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadMatchingResources();
  }

  getMatchPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getMatchPercentageClass(percentage: number): string {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
} 