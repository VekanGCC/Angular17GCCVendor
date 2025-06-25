import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppService } from '../../services/app.service';
import { ClientService } from '../../services/client.service';
import { User } from '../../models/user.model';
import { Resource } from '../../models/resource.model';
import { Requirement } from '../../models/requirement.model';
import { Application } from '../../models/application.model';
import { VendorUser } from '../../models/vendor-user.model';
import { LayoutComponent } from '../layout/layout.component';
import { RequirementModalComponent } from '../modals/requirement-modal/requirement-modal.component';
import { ClientOverviewComponent } from './client-overview/client-overview.component';
import { ClientRequirementsComponent } from './client-requirements/client-requirements.component';
import { ClientResourcesComponent } from './client-resources/client-resources.component';
import { ClientApplicationsComponent } from './client-applications/client-applications.component';
import { ClientUserManagementComponent } from './client-user-management/client-user-management.component';
import { ApplicationHistoryModalComponent, ApplicationHistoryEntry } from '../modals/application-history-modal/application-history-modal.component';
import { ApplicationDetailsModalComponent } from '../modals/application-details-modal/application-details-modal.component';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProfileDashboardComponent } from '../profile/profile-dashboard.component';
import { ApiService } from '../../services/api.service';
import { PaginationState } from '../../models/pagination.model';
import { VendorSkillManagementComponent } from '../vendor-dashboard/vendor-skill-management/vendor-skill-management.component';
import { VendorUserManagementComponent } from '../vendor-dashboard/vendor-user-management/vendor-user-management.component';
import { ResourceModalComponent } from '../modals/resource-modal/resource-modal.component';
import { ApplyRequirementModalComponent } from '../modals/apply-requirement-modal/apply-requirement-modal.component';
import { AddUserModalComponent } from '../modals/add-user-modal/add-user-modal.component';
import { AddSkillModalComponent } from '../modals/add-skill-modal/add-skill-modal.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { ApplyResourcesPageComponent } from './apply-resources-page/apply-resources-page.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LayoutComponent, 
    RequirementModalComponent,
    ClientOverviewComponent,
    ClientRequirementsComponent,
    ClientResourcesComponent,
    ClientApplicationsComponent,
    ClientUserManagementComponent,
    ApplicationHistoryModalComponent,
    ApplicationDetailsModalComponent,
    ProfileDashboardComponent,
    VendorSkillManagementComponent,
    VendorUserManagementComponent,
    ResourceModalComponent,
    ApplyRequirementModalComponent,
    AddUserModalComponent,
    AddSkillModalComponent,
    PaginationComponent,
    ApplyResourcesPageComponent
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
  organizationUsers: User[] = [];
  activeTab: 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'apply-resources' = 'overview';
  showRequirementModal = false;
  showCloseRequirementModal = false;
  showEditRequirementModal = false;
  showAddUserModal = false;
  requirementToClose: Requirement | null = null;
  requirementToEdit: Requirement | null = null;
  showHistoryModal = false;
  selectedApplicationId: string = '';
  isLoadingHistory = false;
  applicationHistory: ApplicationHistoryEntry[] = [];
  showApplicationDetailsModal = false;
  selectedApplication: Application | null = null;

  // Pagination states
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

  // Store current search parameters
  currentSearchParams: any = {};

  selectedResourceIds: string[] = [];
  currentApplicationFilter: any = {};
  
  // Mobile sidebar state
  isSidebarOpen = false;

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
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
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

    // Check for tab query parameter (for returning from apply resources page)
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['overview', 'requirements', 'resources', 'applications', 'profile'].includes(params['tab'])) {
        this.activeTab = params['tab'];
        console.log('Set active tab from query params:', this.activeTab);
      }
    });

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

    this.loadApplications();
    this.loadResources();
    this.loadRequirements();
    this.initializeActiveTab();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeActiveTab(): void {
    // Get the fragment from the URL
    this.route.fragment.subscribe(fragment => {
      if (fragment && ['overview', 'requirements', 'resources', 'applications', 'profile', 'user-management', 'apply-resources'].includes(fragment)) {
        this.activeTab = fragment as 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'apply-resources';
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
    // Use location.replaceState to avoid navigation issues
    const currentUrl = window.location.href.split('#')[0];
    const newUrl = `${currentUrl}#${tab}`;
    window.history.replaceState(null, '', newUrl);
  }

  private loadClientData(): void {
    this.loadRequirements();
    this.loadApplications();
    this.loadResources();
    this.loadOrganizationUsers();
    this.updateStats();
  }

  private loadRequirements(page: number = 1): void {
    this.requirementsPaginationState.isLoading = true;
    const params = { page, limit: this.requirementsPaginationState.pageSize };
    
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
          const paginationData = response.pagination || response.meta;
          if (paginationData) {
            this.updateRequirementsPagination(paginationData);
          }
          
          // Load counts using forkJoin to wait for all data
          this.loadRequirementsWithCounts();
          
          this.updateStats();
        }
      },
      error: (error) => {
        console.error('Error loading requirements:', error);
        this.requirementsPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadRequirementsWithCounts(): void {
    if (this.clientRequirements.length === 0) {
      this.requirementsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
      return;
    }
    
    const requirementIds = this.clientRequirements.map(req => req._id);
    console.log('🔧 ClientDashboard: Loading counts for requirements:', requirementIds);
    
    // Use forkJoin to wait for both counts to be loaded
    forkJoin({
      applicationCounts: this.clientService.getApplicationCountsForRequirements(requirementIds).pipe(
        catchError(error => {
          console.error('🔧 ClientDashboard: Error loading application counts:', error);
          return of({ success: false, data: {} });
        })
      ),
      matchingResourcesCounts: this.clientService.getMatchingResourcesCountsForRequirements(requirementIds).pipe(
        catchError(error => {
          console.error('🔧 ClientDashboard: Error loading matching resources counts:', error);
          return of({ success: false, data: {} });
        })
      )
    }).subscribe({
      next: (results) => {
        console.log('🔧 ClientDashboard: All counts loaded:', results);
        
        // Update requirements with application counts
        if (results.applicationCounts.success && results.applicationCounts.data) {
          this.clientRequirements = this.clientRequirements.map(req => ({
            ...req,
            applicationCount: results.applicationCounts.data[req._id] || 0
          }));
        }
        
        // Update requirements with matching resources counts
        if (results.matchingResourcesCounts.success && results.matchingResourcesCounts.data) {
          this.clientRequirements = this.clientRequirements.map(req => ({
            ...req,
            matchingResourcesCount: results.matchingResourcesCounts.data[req._id] || 0
          }));
        }
        
        // Update the main requirements array
        this.requirements = [...this.clientRequirements];
        
        console.log('🔧 ClientDashboard: Final requirements with counts:', this.clientRequirements);
        
        // Complete loading
        this.requirementsPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('🔧 ClientDashboard: Error loading counts:', error);
        this.requirementsPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
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

  onRequirementsSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    console.log('Requirements sort change:', sortData);
    // You can implement sorting logic here if needed
  }

  onViewApplications(requirementId: string): void {
    console.log('🔧 ClientDashboard: Viewing applications for requirement:', requirementId);
    
    // Switch to applications tab
    this.activeTab = 'applications';
    this.updateUrlFragment('applications');
    
    // Set the requirement filter for applications
    this.currentApplicationFilter = { requirementId };
    
    // Reload applications with the filter
    this.loadApplicationsWithFilter();
  }

  onViewMatchingResources(requirementId: string): void {
    console.log('🔧 ClientDashboard: Viewing matching resources for requirement:', requirementId);
    
    // Switch to resources tab
    this.activeTab = 'resources';
    this.updateUrlFragment('resources');
    
    // Set the requirement filter for resources
    this.currentSearchParams = { requirementId };
    
    // Reload resources with the filter using the API service
    this.loadResourcesWithSearch(this.currentSearchParams, 1);
  }

  onApplicationsPageChange(page: number): void {
    this.loadApplications(page);
  }

  onApplicationsSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    console.log('Applications sort change:', sortData);
    // You can implement sorting logic here if needed
  }

  onResourcesPageChange(page: number): void {
    this.loadResourcesWithSearch(this.currentSearchParams, page);
  }

  private loadApplications(page: number = 1): void {
    this.applicationsPaginationState.isLoading = true;
    const params = { page, limit: this.applicationsPaginationState.pageSize };
    this.clientService.getApplications(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.applications = response.data;
          this.clientApplications = response.data;
          
          // Update pagination state
          const paginationData = response.pagination || response.meta;
          if (paginationData) {
            this.updateApplicationsPagination(paginationData);
          }
          
          this.updateStats();
        }
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      },
      complete: () => {
        this.applicationsPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadResources(page: number = 1, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): void {
    this.resourcesPaginationState.isLoading = true;
    const params = { page, limit: this.resourcesPaginationState.pageSize, sortBy, sortOrder };
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
          const paginationData = response.pagination || response.meta;
          if (paginationData) {
            this.updateResourcesPagination(paginationData);
          }
          
          this.updateStats();
        }
      },
      error: (error) => {
        console.error('Error loading resources:', error);
      },
      complete: () => {
        this.resourcesPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private updateStats(): void {
    if (!this.currentUser) return;

    this.stats[0].value = this.requirementsPaginationState.totalItems || this.clientRequirements.length;
    this.stats[1].value = this.resourcesPaginationState.totalItems || this.resources.length;
    this.stats[2].value = this.applicationsPaginationState.totalItems || this.clientApplications.length;
    this.stats[3].value = this.clientApplications.filter(a => a.status === 'accepted').length;
  }

  setActiveTab(tab: 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'apply-resources'): void {
    console.log('Setting active tab to:', tab);
    this.activeTab = tab;
    this.updateUrlFragment(tab);
    
    // Close sidebar on mobile when switching tabs
    this.closeSidebar();
    
    // Reload data when switching to certain tabs
    switch (tab) {
      case 'requirements':
        console.log('🔧 ClientDashboard: Switching to requirements tab, reloading data...');
        this.loadRequirements(this.requirementsPaginationState.currentPage);
        break;
      case 'applications':
        console.log('🔧 ClientDashboard: Switching to applications tab, reloading data...');
        this.loadApplications(this.applicationsPaginationState.currentPage);
        break;
      case 'resources':
        console.log('🔧 ClientDashboard: Switching to resources tab, reloading data...');
        this.loadResourcesWithSearch(this.currentSearchParams, this.resourcesPaginationState.currentPage);
        break;
      case 'user-management':
        console.log('🔧 ClientDashboard: Switching to user management tab, reloading data...');
        this.loadOrganizationUsers();
        break;
      case 'overview':
        console.log('🔧 ClientDashboard: Switching to overview tab, updating stats...');
        this.updateStats();
        break;
    }
    
    this.changeDetectorRef.detectChanges();
  }

  // Modal handlers
  openRequirementModal(): void {
    this.showRequirementModal = true;
    this.changeDetectorRef.detectChanges();
  }

  openCloseRequirementModal(requirement: Requirement): void {
    console.log('🔍 DEBUG: Client dashboard - Opening close requirement modal for:', requirement._id);
    this.requirementToClose = requirement;
    this.showCloseRequirementModal = true;
    this.changeDetectorRef.detectChanges();
  }

  openEditRequirementModal(requirement: Requirement): void {
    this.requirementToEdit = requirement;
    this.showEditRequirementModal = true;
    // Force change detection to ensure modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  closeCloseRequirementModal(): void {
    console.log('🔍 DEBUG: Client dashboard - Closing close requirement modal');
    this.showCloseRequirementModal = false;
    this.requirementToClose = null;
    this.changeDetectorRef.detectChanges();
  }

  closeEditRequirementModal(): void {
    console.log('🔍 DEBUG: Client dashboard - Closing edit requirement modal');
    this.showEditRequirementModal = false;
    this.requirementToEdit = null;
    this.changeDetectorRef.detectChanges();
  }

  confirmCloseRequirement(): void {
    console.log('🔍 DEBUG: Client dashboard - Confirming close requirement for:', this.requirementToClose?._id);
    if (this.requirementToClose) {
      this.isLoading = true;
      this.clientService.updateRequirement(this.requirementToClose._id, { status: 'cancelled' }).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the requirement in the local array
            const index = this.clientRequirements.findIndex(r => r._id === this.requirementToClose?._id);
            if (index !== -1) {
              this.clientRequirements[index] = { ...this.clientRequirements[index], status: 'cancelled' };
            }
            this.showCloseRequirementModal = false;
            this.requirementToClose = null;
            this.changeDetectorRef.detectChanges();
          }
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error closing requirement:', error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  updateRequirement(requirementId: string, updates: Partial<Requirement>): void {
    this.isLoading = true;
    this.clientService.updateRequirement(requirementId, updates).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('🔧 ClientDashboard: Requirement updated successfully, reloading data');
          // Reload requirements to ensure UI shows the latest data
          this.loadRequirements(this.requirementsPaginationState.currentPage);
          this.closeEditRequirementModal();
          
          // Force change detection to ensure UI updates immediately
          this.changeDetectorRef.detectChanges();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating requirement:', error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  handleRequirementUpdate(requirement: Requirement): void {
    console.log('Handling requirement update:', requirement);
    this.updateRequirement(requirement._id, requirement);
  }

  // Application status management
  handleUpdateApplicationStatus(data: {applicationId: string, status: string, notes?: string}): void {
    console.log('Updating application status:', data);
    
    // Ensure we stay on applications tab
    if (this.activeTab !== 'applications') {
      this.activeTab = 'applications';
    }
    
    // Update local state immediately for responsive UI
    const applicationIndex = this.clientApplications.findIndex(app => app._id === data.applicationId);
    if (applicationIndex !== -1) {
      // Create a new array reference to force change detection
      this.clientApplications = [...this.clientApplications];
      this.clientApplications[applicationIndex].status = data.status as any;
      
      // Also update the main applications array
      const mainAppIndex = this.applications.findIndex(app => app._id === data.applicationId);
      if (mainAppIndex !== -1) {
        this.applications = [...this.applications];
        this.applications[mainAppIndex].status = data.status as any;
      }
      // Update stats without reloading all data
      this.updateStats();
      // Force change detection to ensure UI updates immediately
      this.changeDetectorRef.detectChanges();
    }

    // Make API call to update status
    this.clientService.updateApplicationStatus(data.applicationId, data.status, data.notes).subscribe({
      next: (response) => {
        console.log('Application status updated successfully:', response);
        // Don't call loadApplications() to avoid tab change
        // The local state is already updated above
        // Ensure we're still on applications tab
        if (this.activeTab !== 'applications') {
          this.activeTab = 'applications';
          this.changeDetectorRef.detectChanges();
        }
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
          this.changeDetectorRef.detectChanges();
        }
      }
    });
  }

  handleViewApplicationHistory(applicationId: string): void {
    console.log('Viewing application history for:', applicationId);
    this.selectedApplicationId = applicationId;
    this.showHistoryModal = true;
    this.loadApplicationHistory(applicationId);
    // Force change detection to ensure the modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  handleViewApplicationDetails(application: Application): void {
    console.log('Viewing application details for:', application);
    this.selectedApplication = application;
    this.showApplicationDetailsModal = true;
    this.changeDetectorRef.detectChanges();
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
        // Force change detection immediately after setting isLoading to false
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading application history:', error);
        this.applicationHistory = [];
        this.isLoadingHistory = false;
        // Force change detection immediately after setting isLoading to false
        this.changeDetectorRef.detectChanges();
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

  onResourcesSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    this.loadResources(1, sortData.sortBy, sortData.sortOrder);
  }

  onResourcesSearchChange(searchParams: any): void {
    console.log('Search parameters received:', searchParams);
    this.currentSearchParams = searchParams;
    this.loadResourcesWithSearch(searchParams);
  }

  private loadResourcesWithSearch(searchParams: any, page: number = 1): void {
    this.resourcesPaginationState.isLoading = true;
    
    // Combine search parameters with pagination parameters
    const params = { 
      page, 
      limit: this.resourcesPaginationState.pageSize,
      ...searchParams
    };
    
    console.log('Loading resources with search params:', params);
    
    this.apiService.getResources(params).subscribe({
      next: (response) => {
        console.log('Resources loaded with search:', response);
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
          const paginationData = response.pagination || response.meta;
          if (paginationData) {
            this.updateResourcesPagination(paginationData);
          }
          
          this.updateStats();
        }
      },
      error: (error) => {
        console.error('Error loading resources with search:', error);
      },
      complete: () => {
        this.resourcesPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  applyResource(resourceId: string): void {
    // Navigate to apply resources page with single resource
    this.router.navigate(['/client/apply-resources'], { 
      queryParams: { resourceId: resourceId } 
    });
  }

  applyMultipleResources(resourceIds: string[]): void {
    console.log('🔧 ClientDashboard: applyMultipleResources called with resourceIds:', resourceIds);
    console.log('🔧 ClientDashboard: Current route:', this.router.url);
    
    // Store the selected resource IDs
    this.selectedResourceIds = resourceIds;
    
    // Set the active tab to apply-resources
    this.activeTab = 'apply-resources';
    
    console.log('🔧 ClientDashboard: Setting active tab to apply-resources with resourceIds:', resourceIds);
    
    this.changeDetectorRef.detectChanges();
  }

  navigateBackToBrowse(): void {
    console.log('🔧 ClientDashboard: Navigating back to browse resources');
    this.activeTab = 'resources';
    this.changeDetectorRef.detectChanges();
  }

  // User Management Methods
  getAvailableMenuItems(): any[] {
    const allMenuItems = [
      { id: 'overview', label: 'Overview', icon: 'home.svg' },
      { id: 'requirements', label: 'My Requirements', icon: 'briefcase.svg' },
      { id: 'resources', label: 'Browse Resources', icon: 'users.svg' },
      { id: 'applications', label: 'Applications', icon: 'trending-up.svg' },
      { id: 'user-management', label: 'User Management', icon: 'user-plus.svg' },
      { id: 'profile', label: 'Profile', icon: 'user.svg' }
    ];

    // If user is client_employee, hide user management
    if (this.currentUser?.organizationRole === 'client_employee') {
      return allMenuItems.filter(item => item.id !== 'user-management');
    }

    // If user is client_owner, show all items
    return allMenuItems;
  }

  handleToggleUserStatus(data: {id: string, status: string}): void {
    console.log('🔧 ClientDashboard: Toggling user status:', data);
    
    const newStatus = data.status === 'active' ? 'inactive' : 'active';
    
    this.clientService.updateUserStatus(data.id, newStatus).subscribe({
      next: (response) => {
        console.log('User status updated successfully:', response);
        
        // Update local state immediately for responsive UI
        const userIndex = this.organizationUsers.findIndex(user => user._id === data.id);
        if (userIndex !== -1) {
          this.organizationUsers = [...this.organizationUsers];
          this.organizationUsers[userIndex].isActive = newStatus === 'active';
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error updating user status:', error);
      }
    });
  }

  onUserAdded(user: any): void {
    console.log('🔧 ClientDashboard: User added:', user);
    this.loadOrganizationUsers();
    this.showAddUserModal = false;
  }

  private loadOrganizationUsers(): void {
    console.log('🔧 ClientDashboard: Loading organization users...');
    
    this.clientService.getOrganizationUsers().subscribe({
      next: (response) => {
        console.log('Organization users loaded:', response);
        if (response.success && response.data) {
          this.organizationUsers = response.data;
        } else {
          this.organizationUsers = [];
        }
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading organization users:', error);
        this.organizationUsers = [];
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadApplicationsWithFilter(): void {
    this.applicationsPaginationState.isLoading = true;
    const params = { 
      page: 1, 
      limit: this.applicationsPaginationState.pageSize,
      ...this.currentApplicationFilter
    };
    
    this.clientService.getApplications(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.applications = response.data;
          this.clientApplications = response.data;
          
          // Update pagination state
          const paginationData = response.pagination || response.meta;
          if (paginationData) {
            this.updateApplicationsPagination(paginationData);
          }
          
          this.updateStats();
        }
      },
      error: (error) => {
        console.error('Error loading applications with filter:', error);
      },
      complete: () => {
        this.applicationsPaginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onClearApplicationFilter(): void {
    console.log('🔧 ClientDashboard: Clearing application filter');
    this.currentApplicationFilter = {};
    this.loadApplications(1);
  }

  // Mobile sidebar methods
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.updateBodyScroll();
    this.changeDetectorRef.detectChanges();
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.updateBodyScroll();
    this.changeDetectorRef.detectChanges();
  }

  private updateBodyScroll(): void {
    if (typeof document !== 'undefined') {
      if (this.isSidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }
}