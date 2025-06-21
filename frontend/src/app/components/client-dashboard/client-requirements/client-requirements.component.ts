import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Requirement } from '../../../models/requirement.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';

@Component({
  selector: 'app-client-requirements',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule],
  templateUrl: './client-requirements.component.html',
  styleUrls: ['./client-requirements.component.scss']
})
export class ClientRequirementsComponent implements OnInit, OnChanges {
  @Input() requirements: Requirement[] = [];
  @Input() isLoading = false;
  @Output() openRequirementModal = new EventEmitter<void>();
  @Output() openCloseRequirementModal = new EventEmitter<Requirement>();
  @Output() openEditRequirementModal = new EventEmitter<Requirement>();

  columnDefs: ColDef[] = [
    {
      headerName: 'Requirement',
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
      flex: 1.5,
      sortable: true,
      valueGetter: (params: any) => {
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
      headerName: 'Category',
      field: 'category',
      flex: 1,
      sortable: true,
      cellRenderer: (params: any) => {
        return `<span class="text-sm text-gray-900">${params.value || 'N/A'}</span>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.minYears',
      flex: 1,
      sortable: true,
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
      flex: 1.5,
      sortable: true,
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
      headerName: 'Status',
      field: 'status',
      flex: 1,
      sortable: true,
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
      sortable: true,
      cellRenderer: (params: any) => {
        const date = new Date(params.value);
        return `<span class="text-sm text-gray-500">${date.toLocaleDateString()}</span>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1.5,
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

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requirements'] && !changes['requirements'].firstChange) {
      // Data will be updated automatically through the input binding
    }
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('Sort changed:', sort);
      // You can emit sort changes to parent component if needed
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
    // Force change detection to ensure modal opens immediately
    this.changeDetectorRef.detectChanges();
  }
} 