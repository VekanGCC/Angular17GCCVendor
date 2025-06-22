import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { Application } from '../../../models/application.model';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { AppService } from '../../../services/app.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-apply-resource-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './apply-resource-modal.component.html',
  styleUrls: ['./apply-resource-modal.component.css']
})
export class ApplyResourceModalComponent implements OnInit {
  @Input() resourceId: string = '';
  @Input() resourceIds: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  currentUser: User | null = null;
  selectedRequirement: Requirement | null = null;
  requirements: Requirement[] = [];
  resources: Resource[] = [];
  notes: string = '';
  isLoading = false;
  errorMessage = '';
  applicationResults: { success: boolean; message: string; resourceId: string; requirementId: string }[] = [];

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private appService: AppService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRequirements();
    this.loadResources();
  }

  private loadRequirements(): void {
    this.isLoading = true;
    this.clientService.getRequirements().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Only show open requirements
          this.requirements = response.data.filter((req: Requirement) => req.status === 'open');
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

  private loadResources(): void {
    // Handle both single resource (backward compatibility) and multiple resources
    const resourceIds = this.resourceIds.length > 0 ? this.resourceIds : [this.resourceId];
    
    if (resourceIds.length === 0 || (resourceIds.length === 1 && !resourceIds[0])) {
      console.error('No resource IDs provided');
      this.errorMessage = 'No resources selected';
      return;
    }
    
    console.log('Loading resources with IDs:', resourceIds);
    
    // Load resources from the app service
    this.resources = resourceIds.map(id => this.appService.getResourceById(id)).filter(resource => resource !== undefined) as Resource[];
    
    if (this.resources.length === 0) {
      console.error('No resources found with IDs:', resourceIds);
      this.errorMessage = 'Resources not found';
    }
  }

  selectRequirement(requirement: Requirement): void {
    this.selectedRequirement = requirement;
    this.changeDetectorRef.detectChanges();
  }

  isRequirementSelected(requirementId: string): boolean {
    return this.selectedRequirement?._id === requirementId;
  }

  onSubmit(): void {
    if (!this.selectedRequirement || this.resources.length === 0) {
      this.errorMessage = 'Please select a requirement and ensure resources are loaded';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.applicationResults = [];
    this.changeDetectorRef.detectChanges();

    // Get the resource IDs to apply
    const resourceIds = this.resourceIds.length > 0 ? this.resourceIds : [this.resourceId];
    
    // Apply each resource to the selected requirement
    const applicationPromises = resourceIds.map(resourceId => {
      const applicationData = {
        requirement: this.selectedRequirement!._id,
        resource: resourceId,
        notes: this.notes
      };

      return this.clientService.createApplication(applicationData).toPromise().then(
        (response: any) => {
          return {
            success: response.success,
            message: response.success ? 'Application created successfully' : (response.message || 'Failed to create application'),
            resourceId,
            requirementId: this.selectedRequirement!._id
          };
        },
        (error: any) => {
          let errorMessage = 'Failed to create application';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.status === 409) {
            errorMessage = 'This resource has already been applied to this requirement';
          } else if (error.status === 400) {
            errorMessage = 'Invalid request. Please check your input.';
          }
          
          return {
            success: false,
            message: errorMessage,
            resourceId,
            requirementId: this.selectedRequirement!._id
          };
        }
      );
    });

    // Wait for all applications to complete
    Promise.all(applicationPromises).then(results => {
      this.applicationResults = results;
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
      
      // Check if any applications were successful
      const successfulApplications = results.filter(r => r.success);
      const failedApplications = results.filter(r => !r.success);
      
      if (successfulApplications.length > 0) {
        // Show success message for successful applications
        if (failedApplications.length > 0) {
          this.errorMessage = `${successfulApplications.length} application(s) created successfully. ${failedApplications.length} application(s) failed.`;
          this.changeDetectorRef.detectChanges();
        } else {
          // All applications successful
          this.close.emit();
          this.success.emit();
        }
      } else {
        // All applications failed
        this.errorMessage = 'All applications failed. Please try again.';
        this.changeDetectorRef.detectChanges();
      }
    }).catch(error => {
      console.error('Error in batch application:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    });
  }

  onClose(): void {
    this.close.emit();
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
}