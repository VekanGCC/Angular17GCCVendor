import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Requirement } from '../../../models/requirement.model';
import { PaginationState } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';

@Component({
  selector: 'app-vendor-requirements',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './vendor-requirements.component.html',
  styleUrls: ['./vendor-requirements.component.scss']
})
export class VendorRequirementsComponent {
  @Input() requirements: Requirement[] = [];
  @Input() isLoading = false;
  @Input() paginationState!: PaginationState;
  @Output() applyResources = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();

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