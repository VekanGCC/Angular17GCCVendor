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
import { MatchingRequirementsComponent } from './matching-requirements/matching-requirements.component';
import { InvoiceManagementComponent } from './invoice-management/invoice-management.component';
import { SOWApprovalsComponent } from './sow-approvals/sow-approvals.component';
import { POApprovalsComponent } from './po-approvals/po-approvals.component';

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
    BrowseRequirementsPageComponent,
    MatchingRequirementsComponent,
    InvoiceManagementComponent,
    SOWApprovalsComponent,
    POApprovalsComponent
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
  applicationDetails: any = null;
  activeTab: 'overview' | 'requirements' | 'resources' | 'applications' | 'profile' | 'user-management' | 'skill-management' | 'invoice-management' | 'sow-approvals' | 'po-approvals' = 'overview';
  showVendorManagementDropdown = false;
  showMobileMenu = false;

  // Finance Management menu state
  showFinanceManagementSubmenu = false;
  activeFinanceSubmenu: 'sow-approval' | 'po-approval' | 'invoices' | null = null;

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

  // Matching requirements page properties
  showMatchingRequirementsPage = false;
  selectedResourceId = '';

  // Resource Modal handlers
  resourceToEdit: Resource | null = null;

  // Search and filter state for requirements
  requirementsSearchParams: any = {};
  requirementsSortBy: string = 'createdAt';
  requirementsSortOrder: 'asc' | 'desc' = 'desc';
  
  // Applications filtering
  applicationsResourceFilter: string = '';

  // New property
  currentRequirementsSearchParams: any = {};

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
    if (user) {
      this.currentUser = user;
      console.log('🔄 VendorDashboard: Current user:', user);
    }

    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          console.log('🔄 VendorDashboard: User updated:', user);
          this.loadVendorData();
        }
      })
    );

    // Load initial data
    await this.loadVendorData();
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
      this.loadVendorSkills(),
      this.loadVendorUsers()
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
        
        // Load application counts for resources
        await this.loadResourceApplicationCounts();
        
        // Load matching requirements counts for resources
        await this.loadResourceMatchingCounts();
        
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

  private async loadResourceApplicationCounts(): Promise<void> {
    if (this.vendorResources.length === 0) {
      console.log('🔧 VendorDashboard: No resources to load application counts for');
      return;
    }
    
    try {
      const resourceIds = this.vendorResources.map(resource => resource._id);
      console.log('🔧 VendorDashboard: Loading application counts for resources:', resourceIds);
      
      const response = await this.vendorService.getApplicationCountsForResources(resourceIds).toPromise();
      
      if (response && response.success && response.data) {
        console.log('🔧 VendorDashboard: Application counts response:', response.data);
        
        // Update resources with application counts
        this.vendorResources = this.vendorResources.map(resource => {
          const count = response.data[resource._id] || 0;
          console.log(`🔧 VendorDashboard: Resource ${resource.name} (${resource._id}) has ${count} applications`);
          return {
            ...resource,
            applicationCount: count
          };
        });
        
        console.log('🔧 VendorDashboard: Updated resources with application counts:', this.vendorResources);
        
        // Force change detection to ensure UI updates
        this.changeDetectorRef.detectChanges();
      } else {
        console.log('🔧 VendorDashboard: Invalid response for application counts:', response);
      }
    } catch (error) {
      console.error('🔧 VendorDashboard: Error loading application counts for resources:', error);
    }
  }

  private async loadResourceMatchingCounts(): Promise<void> {
    if (this.vendorResources.length === 0) {
      console.log('🔧 VendorDashboard: No resources to load matching counts for');
      return;
    }
    
    try {
      const resourceIds = this.vendorResources.map(resource => resource._id);
      console.log('🔧 VendorDashboard: Loading matching counts for resources:', resourceIds);
      
      const response = await this.vendorService.getMatchingRequirementsCountsBatch(resourceIds).toPromise();
      
      if (response && response.success && response.data) {
        console.log('🔧 VendorDashboard: Matching counts response:', response.data);
        
        // Update resources with matching counts
        this.vendorResources = this.vendorResources.map(resource => {
          const matchingData = response.data.find((item: any) => item.resourceId === resource._id);
          const count = matchingData ? matchingData.count : 0;
          console.log(`🔧 VendorDashboard: Resource ${resource.name} (${resource._id}) has ${count} matching requirements`);
          return {
            ...resource,
            matchingCount: count
          };
        });
        
        console.log('🔧 VendorDashboard: Updated resources with matching counts:', this.vendorResources);
        
        // Force change detection to ensure UI updates
        this.changeDetectorRef.detectChanges();
      } else {
        console.log('🔧 VendorDashboard: Invalid response for matching counts:', response);
      }
    } catch (error) {
      console.error('🔧 VendorDashboard: Error loading matching counts for resources:', error);
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
    // Use currentRequirementsSearchParams if set
    await this.loadVendorRequirementsWithFiltersAndSort(page, this.requirementsSortBy, this.requirementsSortOrder, this.currentRequirementsSearchParams || this.requirementsSearchParams);
  }

  private async loadVendorSkills(): Promise<void> {
    try {
      const response = await this.apiService.getVendorSkills().toPromise();
      if (response && response.success && response.data) {
        // Create new array references to ensure change detection
        this.vendorSkills = [...response.data];
        this.organizationSkills = [...response.data];
        console.log('🔧 VendorDashboard: Loaded vendor skills:', this.vendorSkills);
        // Force change detection to ensure UI updates
        this.changeDetectorRef.detectChanges();
      }
    } catch (error: any) {
      console.error('Error loading vendor skills:', error);
    }
  }

  private async loadVendorUsers(): Promise<void> {
    try {
      await this.vendorManagementService.refreshVendorUsers();
      this.vendorUsers = this.vendorManagementService.vendorUsers;
      this.organizationUsers = this.vendorManagementService.vendorUsers;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading vendor users:', error);
    }
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
    console.log('🔧 VendorDashboard: Requirements page changed:', page);
    this.loadVendorRequirementsWithFiltersAndSort(page, this.requirementsSortBy, this.requirementsSortOrder, this.requirementsSearchParams);
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
    this.currentRequirementsSearchParams = params;
    this.loadVendorRequirementsWithFiltersAndSort(1, this.requirementsSortBy, this.requirementsSortOrder, params);
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
        
        // Load application counts for resources
        await this.loadResourceApplicationCounts();
        
        // Load matching requirements counts for resources
        await this.loadResourceMatchingCounts();
        
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
        
        // Force change detection to ensure UI updates immediately
        this.changeDetectorRef.detectChanges();
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
    console.log('🔧 VendorDashboard: Setting active tab to:', tabId);
    
    // Handle Finance Management submenu navigation
    if (tabId === 'finance-management') {
      this.showFinanceManagementSubmenu = !this.showFinanceManagementSubmenu;
      if (!this.showFinanceManagementSubmenu) {
        this.activeFinanceSubmenu = null;
      }
      return;
    }
    
    // Handle Finance submenu items
    if (['sow-approval', 'po-approval', 'invoices'].includes(tabId)) {
      this.activeFinanceSubmenu = tabId as 'sow-approval' | 'po-approval' | 'invoices';
      this.showFinanceManagementSubmenu = true;
      
      // Map submenu items to existing tabs
      const tabMapping: { [key: string]: string } = {
        'sow-approval': 'sow-approvals',
        'po-approval': 'po-approvals',
        'invoices': 'invoice-management'
      };
      
      this.activeTab = tabMapping[tabId] as any;
      return;
    }
    
    // Handle regular tabs
    this.activeTab = tabId as any;
    this.showFinanceManagementSubmenu = false;
    this.activeFinanceSubmenu = null;
    
    // Reset page-specific states
    this.showBrowseRequirementsPage = false;
    this.showMatchingRequirementsPage = false;
    this.selectedRequirementId = '';
    this.selectedResourceId = '';
    
    this.changeDetectorRef.detectChanges();
  }

  // Toggle Finance Management submenu
  toggleFinanceManagementSubmenu(): void {
    this.showFinanceManagementSubmenu = !this.showFinanceManagementSubmenu;
    if (!this.showFinanceManagementSubmenu) {
      this.activeFinanceSubmenu = null;
    }
    this.changeDetectorRef.detectChanges();
  }

  // Navigate to Finance submenu item
  navigateToFinanceSubmenu(submenuId: string): void {
    this.activeFinanceSubmenu = submenuId as 'sow-approval' | 'po-approval' | 'invoices';
    this.showFinanceManagementSubmenu = true;
    
    // Map submenu items to existing tabs
    const tabMapping: { [key: string]: string } = {
      'sow-approval': 'sow-approvals',
      'po-approval': 'po-approvals',
      'invoices': 'invoice-management'
    };
    
    this.activeTab = tabMapping[submenuId] as any;
    this.changeDetectorRef.detectChanges();
  }

  // Check if current route is a finance route (not needed for tab-based navigation)
  isFinanceRoute(): boolean {
    return false; // We're using tab-based navigation, not routing
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
    this.changeDetectorRef.detectChanges();
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
  handleUpdateApplicationStatus(data: {applicationId: string, status: string, notes?: string, actionData?: any}): void {
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

    // Make API call to update status with enhanced data
    this.vendorService.updateApplicationStatus(data.applicationId, data.status, data.notes, data.actionData).subscribe({
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
        console.log('🔧 VendorDashboard: Application history response:', response);
        
        // Handle different response structures
        let historyData = [];
        let applicationData = null;
        
        if (response && typeof response === 'object') {
          // If response has a data property
          if (response.data) {
            // Check if data contains both application and history
            if (response.data.application && response.data.history) {
              applicationData = response.data.application;
              historyData = response.data.history;
            }
            // If data is directly an array (old format)
            else if (Array.isArray(response.data)) {
              historyData = response.data;
            }
          }
          // If response has a success property and data
          else if (response.success && response.data) {
            if (response.data.application && response.data.history) {
              applicationData = response.data.application;
              historyData = response.data.history;
            } else if (Array.isArray(response.data)) {
              historyData = response.data;
            }
          }
          // If response is directly an array (fallback)
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
        
        console.log('🔧 VendorDashboard: Processed history data:', historyData);
        console.log('🔧 VendorDashboard: Application data:', applicationData);
        
        // Update the data immediately
        this.applicationHistory = historyData;
        this.applicationDetails = applicationData;
        this.isLoadingHistory = false;
        
        // Force change detection to ensure UI updates immediately
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => {
        console.error('🔧 VendorDashboard: Error loading application history:', error);
        // Update the data immediately on error
        this.applicationHistory = [];
        this.applicationDetails = null;
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
    this.applicationDetails = null;
    this.isLoadingHistory = false;
    this.changeDetectorRef.detectChanges();
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
    this.changeDetectorRef.detectChanges();
  }

  onCloseResourceModal(): void {
    this.showResourceModal = false;
    this.resourceToEdit = null; // Clear the resource being edited
    this.changeDetectorRef.detectChanges();
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
    this.changeDetectorRef.detectChanges();
  }

  onCloseAddVendorSkillModal(): void {
    this.showAddVendorSkillModal = false;
    this.changeDetectorRef.detectChanges();
  }

  onVendorSkillAdded(skill: any): void {
    console.log('🔧 VendorDashboard: Vendor skill added:', skill);
    
    // Immediately add the new skill to local arrays for instant UI update
    this.vendorSkills = [...this.vendorSkills, skill];
    this.organizationSkills = [...this.organizationSkills, skill];
    
    // Force change detection to ensure immediate UI update
    this.changeDetectorRef.detectChanges();
    
    // Then refresh from server to ensure data consistency
    setTimeout(() => {
      this.loadVendorSkills();
    }, 1000);
  }

  onVendorSkillDeleted(skillId: string): void {
    console.log('🔧 VendorDashboard: Vendor skill deleted:', skillId);
    // Remove from local array
    this.vendorSkills = this.vendorSkills.filter(skill => skill._id !== skillId);
    this.organizationSkills = this.organizationSkills.filter(skill => skill._id !== skillId);
  }

  onUserAdded(user: any): void {
    console.log('🔧 VendorDashboard: User added:', user);
    
    // Transform the user data to match VendorUser format
    const transformedUser: VendorUser = {
      id: user.employee?.id || user.id,
      vendorId: user.employee?.organizationId || '',
      name: `${user.employee?.firstName || ''} ${user.employee?.lastName || ''}`.trim(),
      email: user.employee?.email || '',
      role: 'user' as const, // New employees are always users
      department: 'N/A',
      phone: '',
      status: (user.employee?.isActive && user.employee?.isEmailVerified) ? 'active' as const : 'inactive' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'System'
    };
    
    // Immediately add the new user to local arrays for instant UI update
    this.vendorUsers = [...this.vendorUsers, transformedUser];
    this.organizationUsers = [...this.organizationUsers, transformedUser];
    
    // Force change detection to ensure immediate UI update
    this.changeDetectorRef.detectChanges();
    
    // Refresh users from server to ensure data consistency
    setTimeout(() => {
      this.loadVendorUsers();
    }, 1000);
  }

  // Get available menu items based on user role
  getAvailableMenuItems(): any[] {
    const allMenuItems = [
      { id: 'overview', label: 'Overview', icon: 'home.svg' },
      { id: 'requirements', label: 'Browse Requirements', icon: 'briefcase.svg' },
      { id: 'resources', label: 'My Resources', icon: 'users.svg' },
      { id: 'applications', label: 'Vendor Applications', icon: 'trending-up.svg' },
      { 
        id: 'finance-management', 
        label: 'Finance Management', 
        icon: 'dollar-sign.svg', 
        hasSubmenu: true,
        submenu: [
          { id: 'sow-approval', label: 'SOW Approval', route: '/finance/sow-approval' },
          { id: 'po-approval', label: 'PO Approval', route: '/finance/po-acceptance' },
          { id: 'invoices', label: 'Invoice Management', route: '/finance/invoices' }
        ],
        roles: ['vendor_account', 'vendor_owner']
      },
      { id: 'skill-management', label: 'Skills Management', icon: 'settings.svg' },
      { id: 'user-management', label: 'User Management', icon: 'user-plus.svg' },
      { id: 'profile', label: 'Profile', icon: 'user.svg' }
    ];

    // If user is vendor_employee, hide user management, finance management, and approval items
    if (this.currentUser?.organizationRole === 'vendor_employee') {
      return allMenuItems.filter(item => 
        !['user-management', 'finance-management'].includes(item.id)
      );
    }

    // If user is vendor_account, show finance management but hide user management
    if (this.currentUser?.organizationRole === 'vendor_account') {
      return allMenuItems.filter(item => 
        item.id !== 'user-management' && 
        (!item.roles || item.roles.includes('vendor_account'))
      );
    }

    // If user is vendor_owner, show all items
    return allMenuItems;
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
        
        // Force change detection to ensure UI updates immediately
        this.changeDetectorRef.detectChanges();
      }
    } catch (error) {
      console.error('Error loading vendor requirements with filters and sort:', error);
    } finally {
      this.requirementsPaginationState.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  handleApplicationCountClick(resourceId: string): void {
    console.log('🔧 VendorDashboard: Application count clicked for resource:', resourceId);
    
    // Set the resource filter
    this.applicationsResourceFilter = resourceId;
    
    // Switch to applications tab
    this.activeTab = 'applications';
    
    this.changeDetectorRef.detectChanges();
  }

  handleMatchingCountClick(resourceId: string): void {
    console.log('🔧 VendorDashboard: Matching count clicked for resource:', resourceId);
    // Show matching requirements page for this resource
    this.selectedResourceId = resourceId;
    this.showMatchingRequirementsPage = true;
    this.showBrowseRequirementsPage = false;
    this.selectedRequirementId = '';
    this.changeDetectorRef.detectChanges();
  }

  onMatchingRequirementsBack(): void {
    console.log('🔧 VendorDashboard: Navigating back from matching requirements');
    this.showMatchingRequirementsPage = false;
    this.selectedResourceId = '';
    this.changeDetectorRef.detectChanges();
  }

  handleApplyRequirement(requirementId: string): void {
    console.log('🔧 VendorDashboard: Applying to requirement:', requirementId);
    // Switch to requirements tab and show the apply modal
    this.activeTab = 'requirements';
    this.selectedRequirementId = requirementId;
    this.showMatchingRequirementsPage = false;
    this.showBrowseRequirementsPage = true;
    this.changeDetectorRef.detectChanges();
  }

  handleClearApplicationsFilter(): void {
    console.log('🔧 VendorDashboard: Clearing applications filter');
    this.applicationsResourceFilter = '';
    this.changeDetectorRef.detectChanges();
  }

  handleClearRequirementsFilter(): void {
    console.log('🔧 VendorDashboard: Clearing requirements filter');
    this.currentRequirementsSearchParams = {};
    this.requirementsSearchParams = {};
    this.loadVendorRequirementsWithFiltersAndSort(1, this.requirementsSortBy, this.requirementsSortOrder, {});
    this.changeDetectorRef.detectChanges();
  }
}