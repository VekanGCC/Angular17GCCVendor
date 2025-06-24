import { Component, OnInit, ChangeDetectorRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { AppService } from '../../../services/app.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-apply-resources-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './apply-resources-page.component.html',
  styleUrls: ['./apply-resources-page.component.scss']
})
export class ApplyResourcesPageComponent implements OnInit {
  currentUser: User | null = null;
  selectedRequirements: Requirement[] = [];
  requirements: Requirement[] = [];
  filteredRequirements: Requirement[] = [];
  resources: Resource[] = [];
  notes: string = '';
  isLoading = false;
  errorMessage = '';
  applicationResults: { success: boolean; message: string; resourceId: string; requirementId: string }[] = [];
  
  // Multi-select dropdown properties
  showRequirementsDropdown = false;
  requirementSearchTerm = '';
  selectedRequirementIds: string[] = [];

  @Input() selectedResourceIds: string[] = [];
  @Output() selectedResourceIdsChange = new EventEmitter<string[]>();
  @Output() navigateBack = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private appService: AppService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('🔧 ApplyResourcesPage: Constructor called');
  }

  ngOnInit(): void {
    console.log('🔧 ApplyResourcesPage: Component initialized');
    this.currentUser = this.authService.getCurrentUser();
    console.log('🔧 ApplyResourcesPage: Current user:', this.currentUser);
    console.log('🔧 ApplyResourcesPage: Selected resource IDs:', this.selectedResourceIds);
    this.loadResourcesFromInput();
    this.loadRequirements();
  }

  private loadResourcesFromInput(): void {
    console.log('🔧 ApplyResourcesPage: Loading resources from input:', this.selectedResourceIds);
    
    if (this.selectedResourceIds.length === 0) {
      this.errorMessage = 'No resources selected';
      return;
    }
    
    console.log('🔧 ApplyResourcesPage: Loading resources with IDs:', this.selectedResourceIds);
    
    // Subscribe to resources from app service to ensure they're loaded
    this.appService.resources$.subscribe(resources => {
      console.log('🔧 ApplyResourcesPage: Available resources from service:', resources);
      
      // Load resources from the app service
      this.resources = this.selectedResourceIds
        .map((id: string) => this.appService.getResourceById(id))
        .filter((resource: Resource | undefined) => resource !== undefined) as Resource[];
      
      console.log('🔧 ApplyResourcesPage: Loaded resources:', this.resources);
      
      if (this.resources.length === 0) {
        console.error('🔧 ApplyResourcesPage: No resources found with IDs:', this.selectedResourceIds);
        this.errorMessage = 'Resources not found';
      }
      
      this.changeDetectorRef.detectChanges();
    });
  }

  private loadRequirements(): void {
    console.log('🔧 Loading requirements...');
    this.isLoading = true;
    this.clientService.getRequirements().subscribe({
      next: (response) => {
        console.log('🔧 Requirements response:', response);
        if (response.success && response.data) {
          // Only show open requirements
          this.requirements = response.data.filter((req: Requirement) => req.status === 'open');
          this.filteredRequirements = [...this.requirements];
          console.log('🔧 Loaded requirements:', this.requirements.length);
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading requirements:', error);
        this.errorMessage = 'Failed to load requirements';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // Multi-select dropdown methods
  toggleRequirementsDropdown() {
    console.log('🔧 Toggle dropdown clicked, current state:', this.showRequirementsDropdown);
    console.log('🔧 Available requirements:', this.requirements.length);
    this.showRequirementsDropdown = !this.showRequirementsDropdown;
    if (this.showRequirementsDropdown) {
      this.filteredRequirements = [...this.requirements];
    }
    console.log('🔧 New dropdown state:', this.showRequirementsDropdown);
    this.changeDetectorRef.detectChanges();
  }

  filterRequirements() {
    console.log('🔧 Filtering requirements, search term:', this.requirementSearchTerm);
    console.log('🔧 Total requirements available:', this.requirements.length);
    
    if (!this.requirementSearchTerm.trim()) {
      this.filteredRequirements = [...this.requirements];
      console.log('🔧 No search term, showing all requirements:', this.filteredRequirements.length);
    } else {
      const searchTerm = this.requirementSearchTerm.toLowerCase();
      this.filteredRequirements = this.requirements.filter(requirement =>
        requirement.title.toLowerCase().includes(searchTerm) ||
        requirement.description.toLowerCase().includes(searchTerm) ||
        (requirement.skills && requirement.skills.some((skill: string) => 
          skill.toLowerCase().includes(searchTerm)
        ))
      );
      console.log('🔧 Filtered requirements:', this.filteredRequirements.length);
    }
    
    this.changeDetectorRef.detectChanges();
  }

  toggleRequirementSelection(requirementId: string) {
    const index = this.selectedRequirementIds.indexOf(requirementId);
    if (index > -1) {
      this.selectedRequirementIds.splice(index, 1);
    } else {
      this.selectedRequirementIds.push(requirementId);
    }
    this.updateSelectedRequirements();
    this.changeDetectorRef.detectChanges();
  }

  isRequirementSelected(requirementId: string): boolean {
    return this.selectedRequirementIds.includes(requirementId);
  }

  areAllRequirementsSelected(): boolean {
    return this.filteredRequirements.length > 0 && 
           this.filteredRequirements.every(req => this.isRequirementSelected(req._id));
  }

  toggleAllRequirements() {
    if (this.areAllRequirementsSelected()) {
      // Deselect all filtered requirements
      this.filteredRequirements.forEach(req => {
        const index = this.selectedRequirementIds.indexOf(req._id);
        if (index > -1) {
          this.selectedRequirementIds.splice(index, 1);
        }
      });
    } else {
      // Select all filtered requirements
      this.filteredRequirements.forEach(req => {
        if (!this.isRequirementSelected(req._id)) {
          this.selectedRequirementIds.push(req._id);
        }
      });
    }
    this.updateSelectedRequirements();
    this.changeDetectorRef.detectChanges();
  }

  removeRequirement(requirementId: string) {
    const index = this.selectedRequirementIds.indexOf(requirementId);
    if (index > -1) {
      this.selectedRequirementIds.splice(index, 1);
      this.updateSelectedRequirements();
      this.changeDetectorRef.detectChanges();
    }
  }

  onSubmit(): void {
    if (this.selectedRequirementIds.length === 0 || this.resources.length === 0) {
      this.errorMessage = 'Please select at least one requirement and ensure resources are loaded';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.applicationResults = [];
    
    this.resources.forEach(resource => {
      this.selectedRequirementIds.forEach(requirementId => {
        const applicationData = {
          requirement: requirementId,
          resource: resource._id,
          notes: this.notes
        };
        
        this.clientService.createApplication(applicationData).subscribe({
          next: (response) => {
            this.applicationResults.push({
              success: response.success,
              message: response.success ? 'Application created successfully' : (response.message || 'Failed to create application'),
              resourceId: resource._id,
              requirementId: requirementId
            });
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'An error occurred while creating the application';
            this.applicationResults.push({
              success: false,
              message: errorMessage,
              resourceId: resource._id,
              requirementId: requirementId
            });
          }
        });
      });
    });
    
    setTimeout(() => {
      this.isLoading = false;
      if (this.applicationResults.every(result => result.success)) {
        this.navigateBackToBrowse();
      } else {
        this.errorMessage = 'Some applications failed. Please try again.';
        this.changeDetectorRef.detectChanges();
      }
    }, 2000);
  }

  navigateBackToBrowse(): void {
    console.log('🔧 ApplyResourcesPage: Navigating back to browse');
    this.navigateBack.emit();
  }

  onCancel(): void {
    console.log('🔧 ApplyResourcesPage: Cancel clicked');
    this.navigateBack.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.requirements-dropdown-container')) {
      this.showRequirementsDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getResourceName(resourceId: string): string {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  }

  getRequirementName(requirementId: string): string {
    const requirement = this.requirements.find(r => r._id === requirementId);
    return requirement ? requirement.title : 'Unknown Requirement';
  }

  getLocationDisplay(location: any): string {
    if (!location) return 'Location not specified';
    
    const city = location.city || '';
    const state = location.state || '';
    
    if (city && state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    } else {
      return 'Location not specified';
    }
  }

  getSkillDisplayName(skill: any): string {
    if (!skill) return 'Unknown Skill';
    
    // If skill is a string, return it directly
    if (typeof skill === 'string') {
      return skill;
    }
    
    // If skill is an object with a name property, return the name
    if (skill && typeof skill === 'object' && skill.name) {
      return skill.name;
    }
    
    // Fallback
    return 'Unknown Skill';
  }

  private updateSelectedRequirements(): void {
    this.selectedRequirements = this.requirements.filter(req => 
      this.selectedRequirementIds.includes(req._id)
    );
  }
} 