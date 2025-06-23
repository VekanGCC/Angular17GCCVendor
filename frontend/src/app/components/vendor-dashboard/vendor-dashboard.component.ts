import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { VendorManagementService } from '../../services/vendor-management.service';
import { Resource } from '../../models/resource.model';
import { Requirement } from '../../models/requirement.model';
import { Application } from '../../models/application.model';
import { VendorUser } from '../../models/vendor-user.model';
import { VendorSkill } from '../../models/vendor-skill.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { VendorService } from '../../services/vendor.service';
import { VendorOverviewComponent } from './vendor-overview/vendor-overview.component';
import { VendorResourcesComponent } from './vendor-resources/vendor-resources.component';
import { VendorRequirementsComponent } from './vendor-requirements/vendor-requirements.component';
import { VendorApplicationsComponent } from './vendor-applications/vendor-applications.component';
import { VendorUserManagementComponent } from './vendor-user-management/vendor-user-management.component';
import { VendorSkillManagementComponent } from './vendor-skill-management/vendor-skill-management.component';
import { ApplyRequirementModalComponent } from '../modals/apply-requirement-modal/apply-requirement-modal.component';
import { ApplicationHistoryModalComponent } from '../modals/application-history-modal/application-history-modal.component';
import { ProfileDashboardComponent } from '../profile/profile-dashboard.component';
import { ResourceModalComponent } from '../modals/resource-modal/resource-modal.component';
import { AddUserModalComponent } from '../modals/add-user-modal/add-user-modal.component';
import { AddSkillModalComponent } from '../modals/add-skill-modal/add-skill-modal.component';
import { AddVendorSkillModalComponent } from '../modals/add-vendor-skill-modal/add-vendor-skill-modal.component';
import { ApplicationDetailsModalComponent } from '../modals/application-details-modal/application-details-modal.component';
import { LayoutComponent } from '../layout/layout.component';
import { PaginationState, PaginationParams } from '../../models/pagination.model';
import { PaginationComponent } from '../pagination/pagination.component';
import { BrowseRequirementsPageComponent } from './browse-requirements-page/browse-requirements-page.component';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    VendorOverviewComponent,
    VendorResourcesComponent,
    VendorRequirementsComponent,
    VendorApplicationsComponent,
    VendorSkillManagementComponent,
    VendorUserManagementComponent,
    ProfileDashboardComponent,
    ResourceModalComponent,
    ApplyRequirementModalComponent,
    ApplicationHistoryModalComponent,
    AddUserModalComponent,
    AddSkillModalComponent,
    AddVendorSkillModalComponent,
    ApplicationDetailsModalComponent,
    PaginationComponent,
    BrowseRequirementsPageComponent
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  resources: Resource[] = [];
  requirements: Requirement[] = [];
  applications: Application[] = [];
  vendorUsers: VendorUser[] = [];
  vendorSkills: VendorSkill[] = [];
  
  showResourceModal = false;
  showApplyModal = false;
  showAddUserModal = false;
  showAddSkillModal = false;
  showAddVendorSkillModal = false;
  showApplyRequirementModal = false;
  selectedRequirementId: string = '';
  selectedRequirement: Requirement | null = null;
  showHistoryModal = false;
  selectedApplicationId: string = '';
  isLoadingHistory = false;
  applicationHistory: any[] = [];
  activeTab: 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'skill-management' = 'overview';
  showVendorManagementDropdown = false;
  showMobileMenu = false;

  vendorResources: Resource[] = [];
  vendorApplications: Application[] = [];
  organizationUsers: VendorUser[] = [];
  organizationSkills: VendorSkill[] = [];

  // Pagination states
  resourcesPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

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

  stats = [
    {
      title: 'My Resources',
      value: 0,
      icon: 'users',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Available Opportunities',
      value: 0,
      icon: 'briefcase',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Active Applications',
      value: 0,
      icon: 'trending-up',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Placements',
      value: 0,
      icon: 'check-circle',
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    }
  ];

  private subscriptions: Subscription[] = [];

  // Browse requirements page properties
  showBrowseRequirementsPage = false;

  // Resource Modal handlers
  resourceToEdit: Resource | null = null;

  // Search and filter state for requirements
  requirementsSearchParams: any = {};
  requirementsSortBy: string = 'createdAt';
  requirementsSortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private authService: AuthService,
    private appService: AppService,
    private apiService: ApiService,
    private vendorManagementService: VendorManagementService,
    private router: Router,
    private vendorService: VendorService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🔄 VendorDashboard: Initializing...');
    
    // Check authentication state immediately
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('Vendor Dashboard: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is vendor
    if (user.userType !== 'vendor') {
      console.log('Vendor Dashboard: User is not vendor, redirecting to home');
      this.router.navigate(['/']);
      return;
    }

    // Set current user and load data
    this.currentUser = user;
    await this.loadVendorData();

    // Check for profile fragment in URL
    const fragment = this.router.url.split('#')[1];
    if (fragment === 'profile') {
      this.activeTab = 'profile';
    }

    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        console.log('Vendor Dashboard: User state changed:', user);
        if (!user) {
          console.log('Vendor Dashboard: User logged out, redirecting to login');
          this.router.navigate(['/login']);
          return;
        }
        if (user.userType !== 'vendor') {
          console.log('Vendor Dashboard: User is not vendor, redirecting to home');
          this.router.navigate(['/']);
          return;
        }
        this.currentUser = user;
      })
    );

    // Subscribe to loading state
    this.authService.loading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    // Subscribe to resources
    this.subscriptions.push(
      this.appService.resources$.subscribe(resources => {
        console.log('📦 VendorDashboard: Resources updated:', resources?.length || 0);
        this.resources = resources || [];
        this.updateData();
      })
    );

    // Subscribe to requirements
    this.subscriptions.push(
      this.appService.requirements$.subscribe(requirements => {
        console.log('📋 VendorDashboard: Requirements updated:', requirements?.length || 0);
        this.requirements = requirements || [];
        this.updateData();
      })
    );

    // Subscribe to applications
    this.subscriptions.push(
      this.appService.applications$.subscribe(applications => {
        console.log('📊 VendorDashboard: Applications updated:', applications?.length || 0);
        this.applications = applications || [];
        this.updateData();
      })
    );

    // Subscribe to vendor users
    this.subscriptions.push(
      this.vendorManagementService.vendorUsers$.subscribe(users => {
        console.log('👥 VendorDashboard: Vendor users updated:', users?.length || 0);
        this.vendorUsers = users || [];
        this.updateData();
      })
    );

    // Subscribe to vendor skills
    this.subscriptions.push(
      this.vendorManagementService.vendorSkills$.subscribe(skills => {
        console.log('🎯 VendorDashboard: Vendor skills updated:', skills?.length || 0);
        this.vendorSkills = skills || [];
        this.updateData();
      })
    );

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.vendor-management-dropdown')) {
        this.showVendorManagementDropdown = false;
      }
    });

    // Subscribe to route changes
    this.subscriptions.push(
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd)
      ).subscribe(() => {
        console.log('🔄 VendorDashboard: Route changed to:', this.router.url);
        // Check for profile fragment in URL
        const fragment = this.router.url.split('#')[1];
        console.log('🔄 VendorDashboard: URL fragment:', fragment);
        if (fragment === 'profile') {
          console.log('🔄 VendorDashboard: Setting activeTab to profile from URL fragment');
          this.activeTab = 'profile';
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadVendorData(): Promise<void> {
    console.log('Vendor Dashboard: Loading vendor data...');
    
    // Load initial data with pagination
    await Promise.all([
      this.loadVendorResources(),
      this.loadVendorApplications(),
      this.loadVendorRequirements(),
      this.loadVendorSkills()
    ]);
  }

  private async loadVendorResources(page: number = 1): Promise<void> {
    try {
      this.resourcesPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.resourcesPaginationState.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      console.log('🔧 VendorDashboard: Loading vendor resources with params:', params);
      const response = await this.vendorService.getResources(params).toPromise();
      console.log('🔧 VendorDashboard: Resources response:', response);
      
      if (response && response.success && response.data) {
        this.vendorResources = response.data;
        console.log('🔧 VendorDashboard: Updated vendorResources:', this.vendorResources);
        
        // Check for pagination data in both 'meta' and 'pagination' fields
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          console.log('🔧 VendorDashboard: Pagination data:', paginationData);
          this.updateResourcesPagination(paginationData);
          console.log('🔧 VendorDashboard: Updated pagination state:', this.resourcesPaginationState);
        } else {
          console.log('🔧 VendorDashboard: No pagination data found in response');
        }
      } else {
        console.log('🔧 VendorDashboard: Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error loading vendor resources:', error);
    } finally {
      this.resourcesPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadVendorApplications(page: number = 1): Promise<void> {
    try {
      this.applicationsPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.applicationsPaginationState.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      const response = await this.vendorService.getApplications(params).toPromise();
      if (response && response.success && response.data) {
        this.vendorApplications = response.data;
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          this.updateApplicationsPagination(paginationData);
        }
      }
    } catch (error) {
      console.error('Error loading vendor applications:', error);
    } finally {
      this.applicationsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadVendorRequirements(page: number = 1): Promise<void> {
    this.loadVendorRequirementsWithFiltersAndSort(page, this.requirementsSortBy, this.requirementsSortOrder, this.requirementsSearchParams);
  }

  private async loadVendorSkills(): Promise<void> {
    this.apiService.getVendorSkills().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.vendorSkills = response.data;
          this.organizationSkills = response.data;
          console.log('🔧 VendorDashboard: Loaded vendor skills:', this.vendorSkills);
        }
      },
      error: (error: any) => {
        console.error('Error loading vendor skills:', error);
      }
    });
  }

  // Pagination update methods
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

  // Pagination event handlers
  onResourcesPageChange(page: number): void {
    this.loadVendorResources(page);
  }

  onApplicationsPageChange(page: number): void {
    this.loadVendorApplications(page);
  }

  onRequirementsPageChange(page: number): void {
    this.loadVendorRequirementsWithFiltersAndSort(page, this.requirementsSortBy, this.requirementsSortOrder, this.requirementsSearchParams);
  }

  // Sort change event handlers
  onResourcesSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    console.log('🔧 VendorDashboard: Resources sort changed:', sortData);
    this.loadVendorResourcesWithSort(1, sortData.sortBy, sortData.sortOrder);
  }

  onRequirementsSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    console.log('🔧 VendorDashboard: Requirements sort changed:', sortData);
    this.requirementsSortBy = sortData.sortBy;
    this.requirementsSortOrder = sortData.sortOrder;
    this.loadVendorRequirementsWithFiltersAndSort(1, sortData.sortBy, sortData.sortOrder, this.requirementsSearchParams);
  }

  onRequirementsSearchChange(params: any): void {
    console.log('🔧 VendorDashboard: Requirements search changed:', params);
    this.requirementsSearchParams = params;
    this.loadVendorRequirementsWithFiltersAndSort(1, this.requirementsSortBy, this.requirementsSortOrder, params);
  }

  onApplicationsSortChange(sortData: {sortBy: string, sortOrder: 'asc' | 'desc'}): void {
    console.log('🔧 VendorDashboard: Applications sort changed:', sortData);
    this.loadVendorApplicationsWithSort(1, sortData.sortBy, sortData.sortOrder);
  }

  // Enhanced loading methods with sorting
  private async loadVendorResourcesWithSort(page: number = 1, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<void> {
    try {
      this.resourcesPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.resourcesPaginationState.pageSize,
        sortBy,
        sortOrder
      };
      
      console.log('🔧 VendorDashboard: Loading vendor resources with sort params:', params);
      const response = await this.vendorService.getResources(params).toPromise();
      console.log('🔧 VendorDashboard: Resources response:', response);
      
      if (response && response.success && response.data) {
        this.vendorResources = response.data;
        console.log('🔧 VendorDashboard: Updated vendorResources:', this.vendorResources);
        
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          console.log('🔧 VendorDashboard: Pagination data:', paginationData);
          this.updateResourcesPagination(paginationData);
          console.log('🔧 VendorDashboard: Updated pagination state:', this.resourcesPaginationState);
        } else {
          console.log('🔧 VendorDashboard: No pagination data found in response');
        }
      } else {
        console.log('🔧 VendorDashboard: Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error loading vendor resources with sort:', error);
    } finally {
      this.resourcesPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadVendorRequirementsWithSort(page: number = 1, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<void> {
    try {
      this.requirementsPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.requirementsPaginationState.pageSize,
        sortBy,
        sortOrder
      };
      
      console.log('🔧 VendorDashboard: Loading vendor requirements with sort params:', params);
      const response = await this.apiService.getRequirements(params).toPromise();
      if (response && response.success && response.data) {
        this.requirements = response.data;
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          this.updateRequirementsPagination(paginationData);
        }
      }
    } catch (error) {
      console.error('Error loading vendor requirements with sort:', error);
    } finally {
      this.requirementsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadVendorApplicationsWithSort(page: number = 1, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<void> {
    try {
      this.applicationsPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.applicationsPaginationState.pageSize,
        sortBy,
        sortOrder
      };
      
      console.log('🔧 VendorDashboard: Loading vendor applications with sort params:', params);
      const response = await this.vendorService.getApplications(params).toPromise();
      if (response && response.success && response.data) {
        this.vendorApplications = response.data;
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          this.updateApplicationsPagination(paginationData);
        }
      }
    } catch (error) {
      console.error('Error loading vendor applications with sort:', error);
    } finally {
      this.applicationsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private updateData(): void {
    if (!this.currentUser) {
      console.log('⚠️ VendorDashboard: No user found');
      // Reset arrays to empty when no user
      this.vendorResources = [];
      this.vendorApplications = [];
      this.organizationUsers = [];
      this.organizationSkills = [];
      return;
    }

    console.log('🔄 VendorDashboard: Updating data for user:', `${this.currentUser.firstName} ${this.currentUser.lastName}`);
    
    const vendorId = this.currentUser._id;
    
    // Use safe filtering with null checks
    this.vendorResources = (this.resources || []).filter(r => r && r.createdBy === vendorId);
    // Use vendorApplications that are loaded from vendor-specific endpoint
    // this.vendorApplications is already set by loadVendorApplications()
    this.organizationUsers = (this.vendorUsers || []).filter(u => u && u.createdBy === vendorId);
    
    console.log('📊 VendorDashboard: Filtered data:', {
      vendorResources: this.vendorResources.length,
      vendorApplications: this.vendorApplications.length,
      organizationUsers: this.organizationUsers.length,
      totalRequirements: (this.requirements || []).length
    });
    
    // Update stats with safe values
    this.stats[0].value = this.resourcesPaginationState.totalItems || this.vendorResources.length;
    this.stats[1].value = this.requirementsPaginationState.totalItems || (this.requirements || []).length;
    this.stats[2].value = this.applicationsPaginationState.totalItems || this.vendorApplications.length;
    this.stats[3].value = this.vendorApplications.filter(a => a && a.status === 'accepted').length;
  }

  setActiveTab(tabId: string): void {
    console.log('🔄 VendorDashboard: setActiveTab method called with tabId:', tabId);
    console.log('🔄 VendorDashboard: Setting active tab to:', tabId);
    console.log('🔄 VendorDashboard: Current activeTab before change:', this.activeTab);
    
    this.activeTab = tabId as 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'skill-management';
    
    console.log('🔄 VendorDashboard: New activeTab after change:', this.activeTab);
    console.log('🔄 VendorDashboard: Is profile tab?', tabId === 'profile');
    
    this.showVendorManagementDropdown = false;
    
    // Reload data when specific tabs are selected
    if (tabId === 'applications') {
      this.loadVendorApplications();
    } else if (tabId === 'requirements') {
      this.loadVendorRequirementsWithFiltersAndSort(1, this.requirementsSortBy, this.requirementsSortOrder, this.requirementsSearchParams);
    } else if (tabId === 'resources') {
      this.loadVendorResources();
    }
  }

  toggleVendorManagementDropdown(): void {
    this.showVendorManagementDropdown = !this.showVendorManagementDropdown;
  }

  getResourceName(resourceId: string): string {
    const resource = (this.resources || []).find(r => r && r._id === resourceId);
    return resource?.name || 'Unknown Resource';
  }

  getRequirementTitle(requirementId: string): string {
    if (!requirementId) return 'Unknown Requirement';
    const requirement = (this.requirements || []).find(r => r && r._id === requirementId);
    return requirement?.title || 'Unknown Requirement';
  }

  getApplicationResourceName(app: Application): string {
    if (typeof app.resource === 'object' && app.resource) {
      return app.resource.name || 'Unknown Resource';
    } else if (typeof app.resource === 'string') {
      return this.getResourceName(app.resource);
    }
    return 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'object' && app.requirement) {
      return app.requirement.title || 'Unknown Requirement';
    } else if (typeof app.requirement === 'string') {
      return this.getRequirementTitle(app.requirement);
    }
    return 'Unknown Requirement';
  }

  getFirstThreeSkills(skills: string[]): string[] {
    if (!skills || !Array.isArray(skills)) return [];
    return skills.slice(0, 3);
  }

  getAvailabilityClass(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'partially_available':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailabilityIcon(status: string): string {
    switch (status) {
      case 'available':
        return 'check-circle';
      case 'partially_available':
        return 'clock';
      case 'unavailable':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  formatAvailability(status: string): string {
    switch (status) {
      case 'available':
        return 'Available';
      case 'partially_available':
        return 'Partially Available';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  }

  getUserRoleClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserStatusClass(status: string): string {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getSkillStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getProficiencyClass(level: string): string {
    switch (level) {
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    const statusConfig: { [key: string]: { color: string; icon: string } } = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
      shortlisted: { color: 'bg-blue-100 text-blue-800', icon: 'eye' },
      accepted: { color: 'bg-green-100 text-green-800', icon: 'check-circle' },
      rejected: { color: 'bg-red-100 text-red-800', icon: 'x-circle' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: 'x-circle' }
    };
    
    return statusConfig[status] || statusConfig['pending'];
  }

  handleApplyResources(requirementId: string): void {
    console.log('🔄 VendorDashboard: Applying resources to requirement:', requirementId);
    this.selectedRequirementId = requirementId;
    this.showBrowseRequirementsPage = true;
    this.changeDetectorRef.detectChanges();
  }

  handleEditResource(resource: Resource): void {
    console.log('Editing resource:', resource);
    this.resourceToEdit = resource;
    this.showResourceModal = true;
  }

  handleToggleResourceStatus(data: {resourceId: string, currentStatus: 'active' | 'inactive'}): void {
    // Handle toggling resource status
    console.log('Toggling resource status:', data);
    
    // Find the resource in the local array
    const resourceIndex = this.vendorResources.findIndex(r => r._id === data.resourceId);
    if (resourceIndex !== -1) {
      // Show loading state
      this.isLoading = true;
      
      // Make API call to update resource status
      this.vendorService.updateResourceStatus(data.resourceId, data.currentStatus).subscribe({
        next: (response) => {
          console.log('Resource status updated successfully:', response);
          
          // Update the local resource status
          this.vendorResources[resourceIndex].status = data.currentStatus;
          
          // Refresh the resources data to ensure consistency
          this.appService.reloadResources();
          
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error updating resource status:', error);
          
          // Revert the local change if API call failed
          if (resourceIndex !== -1) {
            const originalStatus = data.currentStatus === 'active' ? 'inactive' : 'active';
            this.vendorResources[resourceIndex].status = originalStatus;
          }
          
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
          
          // TODO: Show error message to user
          // You can add a toast notification service here
        }
      });
    }
  }

  handleToggleUserStatus(data: {id: string, status: string}): void {
    console.log('🔄 VendorDashboard: Toggling user status:', data);
    const status: 'active' | 'inactive' = data.status === 'active' ? 'active' : 'inactive';
    this.vendorManagementService.toggleUserStatus(data.id, status);
  }

  // Application status management for vendors
  handleUpdateApplicationStatus(data: {applicationId: string, status: string, notes?: string}): void {
    console.log('🔄 VendorDashboard: Updating application status:', data);
    
    // Ensure we stay on applications tab
    if (this.activeTab !== 'applications') {
      this.activeTab = 'applications';
    }
    
    // Update local state immediately for responsive UI
    const applicationIndex = this.vendorApplications.findIndex(app => app._id === data.applicationId);
    if (applicationIndex !== -1) {
      // Create a new array reference to force change detection
      this.vendorApplications = [...this.vendorApplications];
      this.vendorApplications[applicationIndex].status = data.status as any;
      
      // Also update the main applications array
      const mainAppIndex = this.applications.findIndex(app => app._id === data.applicationId);
      if (mainAppIndex !== -1) {
        this.applications = [...this.applications];
        this.applications[mainAppIndex].status = data.status as any;
      }
      // Update stats without reloading all data
      this.updateData();
      // Force change detection to ensure UI updates immediately
      this.changeDetectorRef.detectChanges();
    }

    // Make API call to update status
    this.vendorService.updateApplicationStatus(data.applicationId, data.status, data.notes).subscribe({
      next: (response) => {
        console.log('✅ VendorDashboard: Application status updated successfully:', response);
        // Don't call loadVendorApplications() to avoid tab change
        // The local state is already updated above
        // Ensure we're still on applications tab
        if (this.activeTab !== 'applications') {
          this.activeTab = 'applications';
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ VendorDashboard: Error updating application status:', error);
        // Revert local change if API call failed
        if (applicationIndex !== -1) {
          this.vendorApplications[applicationIndex].status = this.applications.find(app => app._id === data.applicationId)?.status || 'applied';
          // Also revert the main applications array
          const mainAppIndex = this.applications.findIndex(app => app._id === data.applicationId);
          if (mainAppIndex !== -1) {
            this.applications[mainAppIndex].status = this.vendorApplications[applicationIndex].status;
          }
          this.updateData();
          this.changeDetectorRef.detectChanges();
        }
      }
    });
  }

  // Application history management for vendors
  handleViewApplicationHistory(applicationId: string): void {
    if (!applicationId || applicationId.trim() === '') {
      return;
    }
    
    // Set all states together to ensure proper binding
    this.selectedApplicationId = applicationId;
    this.showHistoryModal = true;
    this.isLoadingHistory = true;
    this.applicationHistory = []; // Clear previous data
    
    // Load data immediately without delay
    this.loadApplicationHistory(applicationId);
  }

  private loadApplicationHistory(applicationId: string): void {
    this.vendorService.getApplicationHistory(applicationId).subscribe({
      next: (response: any) => {
        // Handle different response structures
        let historyData = [];
        
        if (response && typeof response === 'object') {
          // If response has a data property
          if (response.data && Array.isArray(response.data)) {
            historyData = response.data;
          }
          // If response has a success property and data
          else if (response.success && response.data && Array.isArray(response.data)) {
            historyData = response.data;
          }
          // If response is directly an array
          else if (Array.isArray(response)) {
            historyData = response;
          }
          // If response has a different structure, try to find the data
          else {
            // Look for any array property that might contain the history
            for (const key in response) {
              if (Array.isArray(response[key])) {
                historyData = response[key];
                break;
              }
            }
          }
        }
        
        // Update the data immediately
        this.applicationHistory = historyData;
        this.isLoadingHistory = false;
        
        // Force change detection to ensure UI updates immediately
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => {
        // Update the data immediately on error
        this.applicationHistory = [];
        this.isLoadingHistory = false;
        
        // Force change detection to ensure UI updates immediately
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedApplicationId = '';
    this.applicationHistory = [];
    this.isLoadingHistory = false;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedRequirementId = '';
  }

  closeApplyRequirementModal(): void {
    this.showApplyRequirementModal = false;
    this.selectedRequirementId = '';
  }

  onApplicationSuccess(): void {
    this.closeApplyRequirementModal();
    // Refresh applications after successful creation
    this.loadVendorApplications();
    console.log('Application created successfully');
  }

  toggleUserStatus(userId: string, currentStatus: string): void {
    if (!userId) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    this.vendorManagementService.updateUserStatus(userId, newStatus as VendorUser['status']);
  }

  formatStatus(status: string): string {
    if (!status) return 'Unknown';
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Track by functions for *ngFor loops
  trackByTitle(index: number, item: any): any {
    return item?.title || index;
  }

  trackById(index: number, item: any): any {
    return item?._id || index;
  }

  trackByStatTitle(index: number, item: any): any {
    return item?.title || index;
  }

  // Resource Modal handlers
  onOpenResourceModal(): void {
    this.showResourceModal = true;
  }

  onCloseResourceModal(): void {
    this.showResourceModal = false;
    this.resourceToEdit = null; // Clear the resource being edited
    // Refresh resources data after modal is closed
    this.loadVendorResources(this.resourcesPaginationState.currentPage);
  }

  onBrowseRequirementsBack(): void {
    console.log('🔧 VendorDashboard: Navigating back from browse requirements');
    this.showBrowseRequirementsPage = false;
    this.selectedRequirementId = '';
    this.changeDetectorRef.detectChanges();
  }

  // Vendor Skill Modal handlers
  onOpenAddVendorSkillModal(): void {
    this.showAddVendorSkillModal = true;
  }

  onCloseAddVendorSkillModal(): void {
    this.showAddVendorSkillModal = false;
  }

  onVendorSkillAdded(skill: any): void {
    console.log('🔧 VendorDashboard: Vendor skill added:', skill);
    // Refresh vendor skills data
    this.loadVendorSkills();
  }

  onVendorSkillDeleted(skillId: string): void {
    console.log('🔧 VendorDashboard: Vendor skill deleted:', skillId);
    // Remove from local array
    this.vendorSkills = this.vendorSkills.filter(skill => skill._id !== skillId);
    this.organizationSkills = this.organizationSkills.filter(skill => skill._id !== skillId);
  }

  private async loadVendorRequirementsWithFiltersAndSort(page: number, sortBy: string, sortOrder: 'asc' | 'desc', searchParams: any): Promise<void> {
    try {
      this.requirementsPaginationState.isLoading = true;
      const params: PaginationParams = {
        page,
        limit: this.requirementsPaginationState.pageSize,
        sortBy,
        sortOrder,
        ...searchParams
      };
      
      console.log('🔧 VendorDashboard: Loading vendor requirements with filters and sort params:', params);
      const response = await this.apiService.getRequirements(params).toPromise();
      if (response && response.success && response.data) {
        this.requirements = response.data;
        const paginationData = response.meta || response.pagination;
        if (paginationData) {
          this.updateRequirementsPagination(paginationData);
        }
      }
    } catch (error) {
      console.error('Error loading vendor requirements with filters and sort:', error);
    } finally {
      this.requirementsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }
}