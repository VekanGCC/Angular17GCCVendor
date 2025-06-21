import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppService } from '../../services/app.service';
import { ClientService } from '../../services/client.service';
import { User } from '../../models/user.model';
import { Resource } from '../../models/resource.model';
import { Requirement } from '../../models/requirement.model';
import { Application } from '../../models/application.model';
import { PaginationState } from '../../models/pagination.model';
import { LayoutComponent } from '../layout/layout.component';
import { RequirementModalComponent } from '../modals/requirement-modal/requirement-modal.component';
import { ApplyResourceModalComponent } from '../modals/apply-resource-modal/apply-resource-modal.component';
import { ClientOverviewComponent } from './client-overview/client-overview.component';
import { ClientRequirementsComponent } from './client-requirements/client-requirements.component';
import { ClientResourcesComponent } from './client-resources/client-resources.component';
import { ClientApplicationsComponent } from './client-applications/client-applications.component';
import { ApplicationHistoryModalComponent, ApplicationHistoryEntry } from '../modals/application-history-modal/application-history-modal.component';
import { ApplicationDetailsModalComponent } from '../modals/application-details-modal/application-details-modal.component';
import { Subscription } from 'rxjs';
import { ProfileDashboardComponent } from '../profile/profile-dashboard.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LayoutComponent, 
    RequirementModalComponent,
    ApplyResourceModalComponent,
    ClientOverviewComponent,
    ClientRequirementsComponent,
    ClientResourcesComponent,
    ClientApplicationsComponent,
    ApplicationHistoryModalComponent,
    ApplicationDetailsModalComponent,
    ProfileDashboardComponent,
    PaginationComponent
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  requirements: Requirement[] = [];
  applications: Application[] = [];
  resources: Resource[] = [];
  clientRequirements: Requirement[] = [];
  clientApplications: Application[] = [];
  activeTab = 'overview';
  showRequirementModal = false;
  showApplyModal = false;
  showCloseRequirementModal = false;
  showEditRequirementModal = false;
  selectedResourceId: string | null = null;
  selectedResourceIds: string[] = [];
  requirementToClose: Requirement | null = null;
  requirementToEdit: Requirement | null = null;
  showHistoryModal = false;
  selectedApplicationId: string = '';
  isLoadingHistory = false;
  applicationHistory: ApplicationHistoryEntry[] = [];
  showApplicationDetailsModal = false;
  selectedApplication: Application | null = null;

  // Pagination state for each tab
  requirementsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  applicationsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  resourcesPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  stats = [
    { 
      title: 'Requirements', 
      value: 0,
      icon: 'briefcase',
      bg: 'bg-blue-50',
      color: 'text-blue-600'
    },
    { 
      title: 'Resources', 
      value: 0,
      icon: 'users',
      bg: 'bg-green-50',
      color: 'text-green-600'
    },
    { 
      title: 'Active Applications', 
      value: 0,
      icon: 'trending-up',
      bg: 'bg-purple-50',
      color: 'text-purple-600'
    },
    { 
      title: 'Onboarded Resources', 
      value: 0,
      icon: 'check-circle',
      bg: 'bg-yellow-50',
      color: 'text-yellow-600'
    }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('🔄 ClientDashboard: Initializing...');
    
    // Check authentication state immediately
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('Client Dashboard: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is client
    if (user.userType !== 'client') {
      console.log('Client Dashboard: User is not client, redirecting to home');
      this.router.navigate(['/']);
      return;
    }

    // Set current user and load data
    this.currentUser = user;
    this.loadClientData();

    // Check for profile fragment in URL
    const fragment = this.router.url.split('#')[1];
    if (fragment === 'profile') {
      this.activeTab = 'profile';
    }

    // Subscribe to user changes
    this.subscriptions.push(this.authService.user$.subscribe((user: User | null) => {
      if (user) {
        this.currentUser = user;
        this.loadClientData();
      } else {
        this.currentUser = null;
        this.loadClientData();
      }
    }));

    this.loadRequirements();
    this.loadApplications();
    this.loadResources();
    this.initializeActiveTab();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeActiveTab(): void {
    // Get the fragment from the URL
    this.route.fragment.subscribe(fragment => {
      if (fragment && ['overview', 'requirements', 'resources', 'applications', 'profile'].includes(fragment)) {
        this.activeTab = fragment;
        console.log('Restored active tab from URL:', this.activeTab);
      } else {
        // Default to overview if no valid fragment
        this.activeTab = 'overview';
        this.updateUrlFragment('overview');
      }
    });
  }

  private updateUrlFragment(tab: string): void {
    // Update the URL fragment without triggering navigation
    this.router.navigate([], { 
      fragment: tab,
      replaceUrl: true 
    });
  }

  private loadClientData(): void {
    this.loadRequirements();
    this.loadApplications();
    this.loadResources();
    this.updateStats();
  }

  private loadRequirements(page: number = 1): void {
    this.requirementsPaginationState.isLoading = true;
    const params = {
      page,
      limit: this.requirementsPaginationState.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };
    
    this.clientService.getRequirements(params).subscribe({
      next: (response) => {
        console.log('Requirements loaded:', response);
        if (response.success && response.data) {
          // Process the requirements to ensure all fields are properly set
          this.requirements = response.data.map((req: any, index: number) => {
            console.log(`Processing requirement ${index}:`, req);
            return {
              ...req,
              skills: Array.isArray(req.skills) ? req.skills : [],
              status: req.status || 'unknown',
              _id: req._id || `temp-id-${index}`
            };
          });
          this.clientRequirements = [...this.requirements];
          console.log('Processed requirements:', this.clientRequirements);
          
          // Update pagination state
          const paginationData = response.meta || response.pagination;
          if (paginationData) {
            this.updateRequirementsPagination(paginationData);
          }
          
          this.updateStats();
        }
        this.requirementsPaginationState.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading requirements:', error);
        this.requirementsPaginationState.isLoading = false;
      }
    });
  }

  private loadApplications(page: number = 1): void {
    this.applicationsPaginationState.isLoading = true;
    const params = {
      page,
      limit: this.applicationsPaginationState.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };
    
    this.clientService.getApplications(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.applications = response.data;
          this.clientApplications = response.data;
          
          // Update pagination state
          const paginationData = response.meta || response.pagination;
          if (paginationData) {
            this.updateApplicationsPagination(paginationData);
          }
          
          this.updateStats();
        }
        this.applicationsPaginationState.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.applicationsPaginationState.isLoading = false;
      }
    });
  }

  private loadResources(page: number = 1): void {
    this.resourcesPaginationState.isLoading = true;
    const params = {
      page,
      limit: this.resourcesPaginationState.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };
    
    this.apiService.getResources(params).subscribe({
      next: (response) => {
        console.log('Resources loaded:', response);
        if (response.success && response.data) {
          // Process and type the resources
          this.resources = response.data.map((resource: Resource) => {
            // Ensure all required fields are present and properly typed
            return {
              ...resource,
              experience: resource.experience || { years: 0, level: 'Not specified' },
              location: resource.location || { city: 'N/A', state: 'N/A', remote: false },
              availability: resource.availability || { status: 'Not specified', hours_per_week: 0 },
              rate: resource.rate || { currency: 'USD', hourly: 0 },
              skills: resource.skills || []
            };
          });
          console.log('Processed resources:', this.resources);
          
          // Update pagination state
          const paginationData = response.meta || response.pagination;
          if (paginationData) {
            this.updateResourcesPagination(paginationData);
          }
          
          this.updateStats();
        }
        this.resourcesPaginationState.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        this.resourcesPaginationState.isLoading = false;
      }
    });
  }

  private updateStats(): void {
    if (!this.currentUser) return;

    this.stats[0].value = this.clientRequirements.length;
    this.stats[1].value = this.resources.length;
    this.stats[2].value = this.clientApplications.filter(a => !['rejected', 'accepted'].includes(a.status)).length;
    this.stats[3].value = this.clientApplications.filter(a => a.status === 'accepted').length;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'resources') {
      this.loadResources();
    } else if (tab === 'applications') {
      this.loadApplications();
    } else if (tab === 'requirements') {
      console.log('Switching to requirements tab, refreshing data...');
      this.loadRequirements();
    }
    this.updateUrlFragment(tab);
  }

  // Modal handlers
  openRequirementModal(): void {
    this.showRequirementModal = true;
  }

  openCloseRequirementModal(requirement: Requirement): void {
    this.requirementToClose = requirement;
    this.showCloseRequirementModal = true;
  }

  openEditRequirementModal(requirement: Requirement): void {
    this.requirementToEdit = requirement;
    this.showEditRequirementModal = true;
  }

  closeCloseRequirementModal(): void {
    this.showCloseRequirementModal = false;
    this.requirementToClose = null;
  }

  confirmCloseRequirement(): void {
    if (this.requirementToClose) {
      this.isLoading = true;
      this.clientService.updateRequirement(this.requirementToClose._id, { status: 'closed' }).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the requirement in the local array
            const index = this.clientRequirements.findIndex(r => r._id === this.requirementToClose?._id);
            if (index !== -1) {
              this.clientRequirements[index] = { ...this.clientRequirements[index], status: 'closed' };
            }
            this.showCloseRequirementModal = false;
            this.requirementToClose = null;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error closing requirement:', error);
          this.isLoading = false;
        }
      });
    }
  }

  updateRequirement(requirementId: string, updates: Partial<Requirement>): void {
    this.isLoading = true;
    this.clientService.updateRequirement(requirementId, updates).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the requirement in the local array
          const index = this.clientRequirements.findIndex(r => r._id === requirementId);
          if (index !== -1) {
            this.clientRequirements[index] = { ...this.clientRequirements[index], ...updates };
          }
          this.showEditRequirementModal = false;
          this.requirementToEdit = null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating requirement:', error);
        this.isLoading = false;
      }
    });
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedResourceId = null;
    this.selectedResourceIds = [];
  }

  onApplicationSuccess(): void {
    this.closeApplyModal();
    // Refresh applications after successful creation
    this.loadApplications();
    console.log('Application created successfully');
  }

  applyResource(resourceId: string): void {
    this.selectedResourceId = resourceId;
    this.showApplyModal = true;
  }

  applyMultipleResources(resourceIds: string[]): void {
    // Store the selected resource IDs for the modal
    this.selectedResourceIds = resourceIds;
    this.showApplyModal = true;
  }

  handleRequirementUpdate(requirement: Requirement): void {
    console.log('Handling requirement update:', requirement);
    this.updateRequirement(requirement._id, requirement);
    this.showEditRequirementModal = false;
  }

  // Application status management
  handleUpdateApplicationStatus(data: {applicationId: string, status: string, notes?: string}): void {
    console.log('Updating application status:', data);
    
    // Update local state immediately for responsive UI
    const applicationIndex = this.clientApplications.findIndex(app => app._id === data.applicationId);
    if (applicationIndex !== -1) {
      this.clientApplications[applicationIndex].status = data.status as any;
      // Also update the main applications array
      const mainAppIndex = this.applications.findIndex(app => app._id === data.applicationId);
      if (mainAppIndex !== -1) {
        this.applications[mainAppIndex].status = data.status as any;
      }
      // Update stats without reloading all data
      this.updateStats();
    }

    // Make API call to update status
    this.clientService.updateApplicationStatus(data.applicationId, data.status, data.notes).subscribe({
      next: (response) => {
        console.log('Application status updated successfully:', response);
        // Don't call loadApplications() to avoid tab change
        // The local state is already updated above
      },
      error: (error) => {
        console.error('Error updating application status:', error);
        // Revert local change if API call failed
        if (applicationIndex !== -1) {
          this.clientApplications[applicationIndex].status = this.applications.find(app => app._id === data.applicationId)?.status || 'applied';
          // Also revert the main applications array
          const mainAppIndex = this.applications.findIndex(app => app._id === data.applicationId);
          if (mainAppIndex !== -1) {
            this.applications[mainAppIndex].status = this.clientApplications[applicationIndex].status;
          }
          this.updateStats();
        }
      }
    });
  }

  handleViewApplicationHistory(applicationId: string): void {
    console.log('Viewing application history for:', applicationId);
    this.selectedApplicationId = applicationId;
    this.showHistoryModal = true;
    this.loadApplicationHistory(applicationId);
  }

  handleViewApplicationDetails(application: Application): void {
    console.log('Viewing application details for:', application);
    this.selectedApplication = application;
    this.showApplicationDetailsModal = true;
  }

  private loadApplicationHistory(applicationId: string): void {
    this.isLoadingHistory = true;
    this.clientService.getApplicationHistory(applicationId).subscribe({
      next: (response) => {
        console.log('Application history loaded:', response);
        if (response.success && response.data) {
          this.applicationHistory = response.data;
        } else {
          this.applicationHistory = [];
        }
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading application history:', error);
        this.applicationHistory = [];
        this.isLoadingHistory = false;
      }
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedApplicationId = '';
    this.applicationHistory = [];
  }

  closeApplicationDetailsModal(): void {
    this.showApplicationDetailsModal = false;
    this.selectedApplication = null;
  }

  // Pagination update methods
  private updateRequirementsPagination(meta: any): void {
    this.requirementsPaginationState = {
      ...this.requirementsPaginationState,
      currentPage: meta.page,
      pageSize: meta.limit,
      totalItems: meta.total,
      totalPages: meta.pages,
      hasNextPage: meta.page < meta.pages,
      hasPreviousPage: meta.page > 1
    };
  }

  private updateApplicationsPagination(meta: any): void {
    this.applicationsPaginationState = {
      ...this.applicationsPaginationState,
      currentPage: meta.page,
      pageSize: meta.limit,
      totalItems: meta.total,
      totalPages: meta.pages,
      hasNextPage: meta.page < meta.pages,
      hasPreviousPage: meta.page > 1
    };
  }

  private updateResourcesPagination(meta: any): void {
    this.resourcesPaginationState = {
      ...this.resourcesPaginationState,
      currentPage: meta.page,
      pageSize: meta.limit,
      totalItems: meta.total,
      totalPages: meta.pages,
      hasNextPage: meta.page < meta.pages,
      hasPreviousPage: meta.page > 1
    };
  }

  // Pagination event handlers
  onRequirementsPageChange(page: number): void {
    this.loadRequirements(page);
  }

  onApplicationsPageChange(page: number): void {
    this.loadApplications(page);
  }

  onResourcesPageChange(page: number): void {
    this.loadResources(page);
  }
}