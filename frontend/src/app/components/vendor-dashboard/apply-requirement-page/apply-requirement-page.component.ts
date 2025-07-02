import { Component, OnInit, ChangeDetectorRef, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-apply-requirement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './apply-requirement-page.component.html',
  styleUrls: ['./apply-requirement-page.component.scss']
})
export class ApplyRequirementPageComponent implements OnInit, AfterViewInit, OnDestroy {
  // Debug: Class instantiation check
  private static instanceCount = 0;
  public instanceId = ++ApplyRequirementPageComponent.instanceCount;
  
  // Static method to check if component is loaded
  static getInstanceCount(): number {
    return ApplyRequirementPageComponent.instanceCount;
  }
  
  // Instance method to access static method from template
  getInstanceCount(): number {
    return ApplyRequirementPageComponent.getInstanceCount();
  }
  
  // Simple test property
  testProperty = 'Component is working!';
  
  currentUser: User | null = null;
  selectedResources: Resource[] = [];
  resources: Resource[] = [];
  filteredResources: Resource[] = [];
  requirement: Requirement | null = null;
  notes: string = '';
  isLoading = false;
  errorMessage = '';
  applicationResults: { success: boolean; message: string; resourceId: string; resourceName: string; requirementId: string; requirementName: string }[] = [];
  
  // Multi-select dropdown properties
  showResourcesDropdown = false;
  resourceSearchTerm = '';
  selectedResourceIds: string[] = [];

  // Computed properties for template
  get successfulApplications() {
    return this.applicationResults.filter(r => r.success);
  }

  get failedApplications() {
    return this.applicationResults.filter(r => !r.success);
  }

  get hasErrors() {
    return this.failedApplications.length > 0;
  }

  get allSuccessful() {
    return this.applicationResults.length > 0 && this.failedApplications.length === 0;
  }

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    public router: Router
  ) {
    console.log('🔧 ApplyRequirementPage: Constructor called - Instance #', this.instanceId);
    console.log('🔧 ApplyRequirementPage: Constructor - Current URL:', this.router.url);
    console.log('🔧 ApplyRequirementPage: Constructor - Route params:', this.route.snapshot.params);
    console.log('🔧 ApplyRequirementPage: Constructor - Query params:', this.route.snapshot.queryParams);
    
    // Initialize the component immediately in constructor
    this.initializeComponent();
  }
  
  private initializeComponent(): void {
    console.log('🔧 ApplyRequirementPage: Component initialization started');
    this.currentUser = this.authService.getCurrentUser();
    console.log('🔧 ApplyRequirementPage: Current user:', this.currentUser);
    
    // Get requirement ID from query parameters
    this.route.queryParams.subscribe(params => {
      console.log('🔧 ApplyRequirementPage: Query params received:', params);
      const requirementId = params['requirementId'] || '';
      console.log('🔧 ApplyRequirementPage: Requirement ID from query params:', requirementId);
      
      if (requirementId) {
        this.loadRequirement(requirementId);
        this.loadResources();
      } else {
        this.errorMessage = 'No requirement ID provided';
      }
    });
  }

  ngOnInit(): void {
    // Note: Component initialization is now handled in constructor due to lifecycle hook issues
    console.log('🔧 ApplyRequirementPage: ngOnInit called - Instance #', this.instanceId);
  }

  ngAfterViewInit(): void {
    console.log('🔧 ApplyRequirementPage: ngAfterViewInit called - Instance #', this.instanceId);
  }

  ngOnDestroy(): void {
    console.log('🔧 ApplyRequirementPage: ngOnDestroy called - Instance #', this.instanceId);
  }

  private loadRequirement(requirementId: string): void {
    console.log('🔧 Loading requirement:', requirementId);
    this.isLoading = true;
    this.apiService.getRequirement(requirementId).subscribe({
      next: (response) => {
        console.log('🔧 Requirement response:', response);
        if (response.success && response.data) {
          this.requirement = response.data;
          console.log('🔧 Loaded requirement:', this.requirement);
        } else {
          this.errorMessage = 'Failed to load requirement';
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading requirement:', error);
        this.errorMessage = 'Failed to load requirement';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadResources(): void {
    console.log('🔧 Loading vendor resources...');
    this.isLoading = true;
    this.apiService.getResources().subscribe({
      next: (response) => {
        console.log('🔧 Resources response:', response);
        if (response.success && response.data) {
          // Filter resources to only show vendor's resources
          // For now, show all resources since vendorId is not in the model
          this.resources = response.data;
          this.filteredResources = [...this.resources];
          console.log('🔧 Loaded vendor resources:', this.resources.length);
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        this.errorMessage = 'Failed to load resources';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // Multi-select dropdown methods
  toggleResourcesDropdown() {
    console.log('🔧 Toggle dropdown clicked, current state:', this.showResourcesDropdown);
    console.log('🔧 Available resources:', this.resources.length);
    this.showResourcesDropdown = !this.showResourcesDropdown;
    if (this.showResourcesDropdown) {
      this.filteredResources = [...this.resources];
    }
    console.log('🔧 New dropdown state:', this.showResourcesDropdown);
    this.changeDetectorRef.detectChanges();
  }

  filterResources() {
    console.log('🔧 Filtering resources, search term:', this.resourceSearchTerm);
    console.log('🔧 Total resources available:', this.resources.length);
    
    if (!this.resourceSearchTerm.trim()) {
      this.filteredResources = [...this.resources];
      console.log('🔧 No search term, showing all resources:', this.filteredResources.length);
    } else {
      const searchTerm = this.resourceSearchTerm.toLowerCase();
      this.filteredResources = this.resources.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        (resource.skills && resource.skills.some((skill: any) => 
          skill.name.toLowerCase().includes(searchTerm)
        ))
      );
      console.log('🔧 Filtered resources:', this.filteredResources.length);
    }
    
    this.changeDetectorRef.detectChanges();
  }

  toggleResourceSelection(resourceId: string) {
    const index = this.selectedResourceIds.indexOf(resourceId);
    if (index > -1) {
      this.selectedResourceIds.splice(index, 1);
    } else {
      this.selectedResourceIds.push(resourceId);
    }
    this.updateSelectedResources();
    this.changeDetectorRef.detectChanges();
  }

  isResourceSelected(resourceId: string): boolean {
    return this.selectedResourceIds.includes(resourceId);
  }

  areAllResourcesSelected(): boolean {
    return this.filteredResources.length > 0 && 
           this.filteredResources.every(resource => this.isResourceSelected(resource._id));
  }

  toggleAllResources() {
    if (this.areAllResourcesSelected()) {
      // Deselect all filtered resources
      this.filteredResources.forEach(resource => {
        const index = this.selectedResourceIds.indexOf(resource._id);
        if (index > -1) {
          this.selectedResourceIds.splice(index, 1);
        }
      });
    } else {
      // Select all filtered resources
      this.filteredResources.forEach(resource => {
        if (!this.isResourceSelected(resource._id)) {
          this.selectedResourceIds.push(resource._id);
        }
      });
    }
    this.updateSelectedResources();
    this.changeDetectorRef.detectChanges();
  }

  removeResource(resourceId: string) {
    const index = this.selectedResourceIds.indexOf(resourceId);
    if (index > -1) {
      this.selectedResourceIds.splice(index, 1);
      this.updateSelectedResources();
      this.changeDetectorRef.detectChanges();
    }
  }

  onSubmit(): void {
    if (this.selectedResourceIds.length === 0 || !this.requirement) {
      this.errorMessage = 'Please select at least one resource and ensure requirement is loaded';
      return;
    }

    console.log('🔧 Submitting application...');
    console.log('🔧 Selected resources:', this.selectedResourceIds);
    console.log('🔧 Requirement ID:', this.requirement._id);
    console.log('🔧 Notes:', this.notes);

    this.isLoading = true;
    this.applicationResults = [];

    // Create applications for each selected resource
    const applicationPromises = this.selectedResourceIds.map(resourceId => {
      const application = {
        requirement: this.requirement!._id,  // Backend expects 'requirement', not 'requirementId'
        resource: resourceId,                // Backend expects 'resource', not 'resourceId'
        notes: this.notes
        // Backend will set status to 'applied' by default
        // Backend will get vendorId from the authenticated user's organizationId
      };

      return this.apiService.createApplication(application).toPromise();
    });

    Promise.all(applicationPromises)
      .then(results => {
        console.log('🔧 Application results:', results);
        
        results.forEach((result, index) => {
          const resourceId = this.selectedResourceIds[index];
          const resourceName = this.getResourceName(resourceId);
          
          if (result && result.success) {
            this.applicationResults.push({
              success: true,
              message: 'Application created successfully',
              resourceId: resourceId,
              resourceName: resourceName,
              requirementId: this.requirement!._id,
              requirementName: this.requirement!.title
            });
          } else {
            // Extract the specific error message from the response
            let errorMessage = 'Failed to create application';
            if (result?.message) {
              errorMessage = result.message;
            } else if (result?.error?.message) {
              errorMessage = result.error.message;
            } else if (typeof result === 'string') {
              errorMessage = result;
            }
            
            this.applicationResults.push({
              success: false,
              message: errorMessage,
              resourceId: resourceId,
              resourceName: resourceName,
              requirementId: this.requirement!._id,
              requirementName: this.requirement!.title
            });
          }
        });

        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      })
      .catch(error => {
        console.error('🔧 Error creating applications:', error);
        this.errorMessage = 'Failed to create applications';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  onCancel(): void {
    console.log('🔧 ApplyRequirementPage: Canceling application');
    this.router.navigate(['/vendor/requirements']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.resources-dropdown-container')) {
      this.showResourcesDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  getLocationDisplay(location: any): string {
    if (!location) return 'Not specified';
    
    const { city, state, country } = location;
    const parts = [city, state, country].filter(Boolean);
    
    if (parts.length === 0) return 'Not specified';
    
    return parts.join(', ');
  }

  getResourceName(resourceId: string): string {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  }

  getResourceRate(resourceId: string): number {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource?.rate?.hourly || 0;
  }

  getResourceExperience(resourceId: string): number {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource?.experience?.years || 0;
  }

  getResourceLocation(resourceId: string): string {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource?.location ? this.getLocationDisplay(resource.location) : 'Not specified';
  }

  getRequirementName(requirementId: string): string {
    return this.requirement ? this.requirement.title : 'Unknown Requirement';
  }

  private updateSelectedResources(): void {
    this.selectedResources = this.resources.filter(resource => 
      this.selectedResourceIds.includes(resource._id)
    );
  }
} 