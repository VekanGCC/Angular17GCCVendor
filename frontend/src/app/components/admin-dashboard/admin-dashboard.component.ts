import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { LayoutComponent } from '../layout/layout.component';
import { AddAdminSkillModalComponent } from '../modals/add-admin-skill-modal/add-admin-skill-modal.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AppService } from '../../services/app.service';
import { VendorManagementService } from '../../services/vendor-management.service';
import { AdminSkill, PlatformStats, TransactionData, UserApproval, SkillApproval } from '../../models/admin.model';
import { VendorSkill } from '../../models/vendor-skill.model';
import { User } from '../../models/user.model';
import { Resource } from '../../models/resource.model';
import { Requirement } from '../../models/requirement.model';
import { Application } from '../../models/application.model';
import { Router } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { PaginationComponent } from '../pagination/pagination.component';
import { PaginationState } from '../../models/pagination.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface NavigationTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideAngularModule, 
    LayoutComponent,
    AddAdminSkillModalComponent,
    PaginationComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  activeTab: 'overview' | 'user-approvals' | 'skill-approvals' | 'skills' | 'applications' | 'users' = 'overview';
  
  // Data
  userApprovals: UserApproval[] = [];
  skillApprovals: SkillApproval[] = [];
  adminSkills: AdminSkill[] = [];
  platformStats: PlatformStats = {
    totalUsers: 0,
    totalVendors: 0,
    totalClients: 0,
    totalResources: 0,
    totalRequirements: 0,
    totalApplications: 0,
    pendingApprovals: 0,
    activeSkills: 0,
    monthlyGrowth: {
      users: 0,
      applications: 0,
      placements: 0
    }
  };
  transactions: TransactionData[] = [];
  allUsers: User[] = [];
  allResources: Resource[] = [];
  allRequirements: Requirement[] = [];
  allApplications: Application[] = [];
  
  // Store full datasets for client-side pagination
  private fullApplications: Application[] = [];
  private fullUsers: User[] = [];

  // Modals
  showAddSkillModal = false;
  showApprovalModal = false;
  showRejectModal = false;
  showSkillApprovalModal = false;
  showSkillRejectModal = false;
  selectedEntity: User | null = null;
  selectedVendorSkill: VendorSkill | null = null;
  rejectNotes = '';
  skillRejectNotes = '';

  // Filters
  approvalFilter = 'all';
  transactionFilter = 'all';
  skillFilter = 'all';
  skillApprovalFilter = 'all';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Loading states
  loadingStates = {
    userApprovals: false,
    skillApprovals: false,
    skills: false,
    stats: false,
    transactions: false,
    applications: false,
    users: false
  };

  // Navigation
  navigationTabs: NavigationTab[] = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'user-approvals', label: 'User Approvals', icon: 'user-check', badge: 0 },
    { id: 'skill-approvals', label: 'Skill Approvals', icon: 'check-circle', badge: 0 },
    { id: 'skills', label: 'Skills', icon: 'list' },
    { id: 'applications', label: 'Applications', icon: 'file-text' },
    { id: 'users', label: 'Users', icon: 'users' }
  ];

  // Pagination states
  applicationsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  usersPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  skillApprovalsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private appService: AppService,
    private vendorManagementService: VendorManagementService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Check authentication state immediately
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('Admin Dashboard: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      console.log('Admin Dashboard: User is not admin, redirecting to home');
      this.router.navigate(['/']);
      return;
    }

    // Set current user and load data
    this.currentUser = user;
    await this.loadDashboardData();

    // Subscribe to auth state changes
    this.authService.user$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      } else if (user.userType !== 'admin') {
        this.router.navigate(['/']);
      } else {
        this.currentUser = user;
        this.loadDashboardData();
      }
    });

    // Subscribe to loading state
    this.authService.loading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions(): void {
    // Subscribe to user approvals
    this.subscriptions.push(
      this.adminService.userApprovals$.subscribe(response => {
        if (response.success) {
          this.userApprovals = response.data;
          this.totalPages = response.pagination?.totalPages || 1;
        }
      })
    );

    // Subscribe to skill approvals
    this.subscriptions.push(
      this.adminService.skillApprovals$.subscribe(response => {
        if (response.success) {
          this.skillApprovals = response.data;
          this.totalPages = response.pagination?.totalPages || 1;
        }
      })
    );

    // Subscribe to admin skills
    this.subscriptions.push(
      this.adminService.adminSkills$.subscribe(skills => {
        this.adminSkills = skills;
      })
    );

    // Subscribe to platform stats
    this.subscriptions.push(
      this.adminService.platformStats$.subscribe(stats => {
        this.platformStats = stats;
        console.log('Platform stats updated:', stats);
      })
    );

    // Subscribe to transactions
    this.subscriptions.push(
      this.adminService.transactions$.subscribe(transactions => {
        this.transactions = transactions;
      })
    );

    // Subscribe to applications
    this.subscriptions.push(
      this.adminService.applications$.subscribe(applications => {
        this.allApplications = applications;
      })
    );
  }

  private async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadUserApprovals(),
        this.loadSkillApprovals(),
        this.loadAdminSkills(),
        this.loadPlatformStats(),
        this.loadApplications(),
        this.loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserApprovals(): Promise<void> {
    this.loadingStates.userApprovals = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getUserApprovals(this.currentPage, this.itemsPerPage)
      );
      this.userApprovals = response.data;
      if (response.pagination) {
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
      }
      this.navigationTabs.find(tab => tab.id === 'user-approvals')!.badge = 
        this.userApprovals.filter(a => a.approvalStatus === 'pending').length;
    } catch (error) {
      console.error('Error loading user approvals:', error);
    } finally {
      this.loadingStates.userApprovals = false;
    }
  }

  private async loadSkillApprovals(): Promise<void> {
    this.skillApprovalsPaginationState.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getSkillApprovals(this.skillApprovalsPaginationState.currentPage, this.skillApprovalsPaginationState.pageSize)
      );
      if (response.success) {
        this.skillApprovals = response.data;
        console.log('Admin Dashboard: Skill approvals data length:', this.skillApprovals.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Skill approvals pagination data:', paginationData);
          this.updateSkillApprovalsPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in skill approvals response');
          // Fallback: calculate from data length
          this.updateSkillApprovalsPagination({
            page: this.skillApprovalsPaginationState.currentPage,
            limit: this.skillApprovalsPaginationState.pageSize,
            total: this.skillApprovals.length,
            pages: Math.max(1, Math.ceil(this.skillApprovals.length / this.skillApprovalsPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load skill approvals:', response.message);
      }
    } catch (error) {
      console.error('Admin Dashboard: Error loading skill approvals:', error);
    } finally {
      this.skillApprovalsPaginationState.isLoading = false;
    }
  }

  private async loadAdminSkills(): Promise<void> {
    this.loadingStates.skills = true;
    try {
      const response = await firstValueFrom(this.adminService.getAdminSkills());
      if (response.success) {
        this.adminSkills = response.data;
        if (response.pagination) {
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
        }
      } else {
        console.error('Admin Dashboard: Failed to load skills:', response.message);
      }
    } catch (error) {
      console.error('Error loading admin skills:', error);
    } finally {
      this.loadingStates.skills = false;
    }
  }

  private async loadPlatformStats(): Promise<void> {
    this.loadingStates.stats = true;
    try {
      const stats = await firstValueFrom(this.adminService.getPlatformStats());
      this.platformStats = stats;
    } catch (error) {
      console.error('Error loading platform stats:', error);
    } finally {
      this.loadingStates.stats = false;
    }
  }

  private async loadTransactions(): Promise<void> {
    this.loadingStates.transactions = true;
    try {
      const transactions = await firstValueFrom(this.adminService.getTransactions());
      this.transactions = transactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      this.loadingStates.transactions = false;
    }
  }

  private async loadApplications(): Promise<void> {
    this.applicationsPaginationState.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getApplications(this.applicationsPaginationState.currentPage, this.applicationsPaginationState.pageSize)
      );
      console.log('Admin Dashboard: Full applications response:', response);
      
      if (response.success) {
        this.allApplications = response.data;
        console.log('Admin Dashboard: Applications data length:', this.allApplications.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Pagination data from response:', paginationData);
          this.updateApplicationsPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in response');
          // Fallback: calculate from data length
          this.updateApplicationsPagination({
            page: this.applicationsPaginationState.currentPage,
            limit: this.applicationsPaginationState.pageSize,
            total: this.allApplications.length,
            pages: Math.max(1, Math.ceil(this.allApplications.length / this.applicationsPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load applications:', response.message);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      this.applicationsPaginationState.isLoading = false;
    }
  }

  private async loadUsers(): Promise<void> {
    this.usersPaginationState.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getUsers(this.usersPaginationState.currentPage, this.usersPaginationState.pageSize)
      );
      console.log('Admin Dashboard: Full users response:', response);
      
      if (response.success) {
        this.allUsers = response.data;
        console.log('Admin Dashboard: Users data length:', this.allUsers.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Pagination data from response:', paginationData);
          this.updateUsersPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in response');
          // Fallback: calculate from data length
          this.updateUsersPagination({
            page: this.usersPaginationState.currentPage,
            limit: this.usersPaginationState.pageSize,
            total: this.allUsers.length,
            pages: Math.max(1, Math.ceil(this.allUsers.length / this.usersPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load users:', response.message);
      }
    } catch (error) {
      console.error('Admin Dashboard: Error loading users:', error);
    } finally {
      this.usersPaginationState.isLoading = false;
    }
  }

  setActiveTab(tab: 'overview' | 'user-approvals' | 'skill-approvals' | 'skills' | 'applications' | 'users'): void {
    this.activeTab = tab;
    
    // Reset pagination states when switching tabs
    this.applicationsPaginationState.currentPage = 1;
    this.usersPaginationState.currentPage = 1;
    this.skillApprovalsPaginationState.currentPage = 1;
    
    this.loadTabData();
  }

  loadTabData(): void {
    switch (this.activeTab) {
      case 'user-approvals':
        this.loadUserApprovals();
        break;
      case 'skill-approvals':
        this.loadSkillApprovals();
        break;
      case 'skills':
        this.loadAdminSkills();
        break;
      case 'applications':
        this.loadApplications();
        break;
      case 'users':
        this.loadUsers();
        break;
    }
  }

  // Approval Management
  openApprovalModal(entity: User): void {
    this.selectedEntity = entity;
    this.showApprovalModal = true;
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedEntity = null;
  }

  openRejectModal(entity: User): void {
    this.selectedEntity = entity;
    this.showRejectModal = true;
    this.rejectNotes = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedEntity = null;
    this.rejectNotes = '';
  }

  approveUser(userId: string): void {
    const sub = this.adminService.approveUser(userId).subscribe({
      next: () => {
        this.loadUserApprovals();
        this.loadPlatformStats();
      },
      error: (error) => {
        console.error('Error approving user:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  rejectUser(userId: string, notes: string): void {
    const sub = this.adminService.rejectUser(userId, notes).subscribe({
      next: () => {
        this.loadUserApprovals();
        this.loadPlatformStats();
      },
      error: (error) => {
        console.error('Error rejecting user:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  // Vendor Skill Approval Management
  openSkillApprovalModal(skill: VendorSkill): void {
    this.selectedVendorSkill = skill;
    this.showSkillApprovalModal = true;
  }

  closeSkillApprovalModal(): void {
    this.showSkillApprovalModal = false;
    this.selectedVendorSkill = null;
  }

  openSkillRejectModal(skill: VendorSkill): void {
    this.selectedVendorSkill = skill;
    this.showSkillRejectModal = true;
    this.skillRejectNotes = '';
  }

  closeSkillRejectModal(): void {
    this.showSkillRejectModal = false;
    this.selectedVendorSkill = null;
    this.skillRejectNotes = '';
  }

  approveSkill(skillId: string): void {
    const sub = this.adminService.approveSkill(skillId).subscribe({
      next: () => {
        this.loadSkillApprovals();
        this.loadPlatformStats();
      },
      error: (error) => {
        console.error('Error approving skill:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  rejectSkill(skillId: string, notes: string): void {
    const sub = this.adminService.rejectSkill(skillId, notes).subscribe({
      next: () => {
        this.loadSkillApprovals();
        this.loadPlatformStats();
      },
      error: (error) => {
        console.error('Error rejecting skill:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  // Skill Management
  async toggleSkillStatus(skill: AdminSkill): Promise<void> {
    try {
      const updatedSkill = await this.adminService.updateSkill(skill.id, {
        ...skill,
        isActive: !skill.isActive
      }).toPromise();
    } catch (error) {
      console.error('Error updating skill status:', error);
    }
  }

  async deleteSkill(skillId: string): Promise<void> {
    try {
      await this.adminService.deleteSkill(skillId).toPromise();
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  }

  // Utility Methods
  getApprovalTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      vendor: 'package',
      client: 'target',
      skill: 'briefcase'
    };
    return icons[type] || 'help-circle';
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object';
  }

  getApprovalTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      vendor: 'text-blue-600 bg-blue-100',
      client: 'text-purple-600 bg-purple-100',
      skill: 'text-green-600 bg-green-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'text-yellow-800 bg-yellow-100',
      approved: 'text-green-800 bg-green-100',
      rejected: 'text-red-800 bg-red-100'
    };
    return colors[status] || 'text-gray-800 bg-gray-100';
  }

  getTransactionTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      application: 'trending-up',
      requirement: 'briefcase',
      resource: 'users',
      user_registration: 'user-plus'
    };
    return icons[type] || 'activity';
  }

  formatTransactionType(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getFilteredApprovals(): UserApproval[] {
    return this.userApprovals.filter(approval => {
      if (this.approvalFilter === 'all') return true;
      return approval.approvalStatus === this.approvalFilter;
    });
  }

  getFilteredTransactions(): TransactionData[] {
    if (this.transactionFilter === 'all') {
      return this.transactions;
    }
    return this.transactions.filter(transaction => transaction.type === this.transactionFilter);
  }

  getFilteredSkills(): AdminSkill[] {
    if (this.skillFilter === 'all') {
      return this.adminSkills;
    }
    return this.adminSkills.filter(skill => skill.category === this.skillFilter);
  }

  getFilteredVendorSkills(): VendorSkill[] {
    if (this.skillApprovalFilter === 'all') {
      return this.skillApprovals.map(a => a.skill);
    }
    return this.skillApprovals.filter(a => a.status === this.skillApprovalFilter).map(a => a.skill);
  }

  getPaginatedItems<T>(items: T[]): T[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return items.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages<T>(items: T[]): number {
    return Math.ceil(items.length / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    console.log('Admin Dashboard: Page change requested to:', page);
    
    // Validate page number
    if (page < 1) {
      console.warn('Admin Dashboard: Invalid page number requested:', page);
      return;
    }
    
    this.currentPage = page;
    this.loadTabData();
  }

  onApplicationsPageChange(page: number): void {
    console.log('Admin Dashboard: Applications page change to:', page);
    this.applicationsPaginationState.currentPage = page;
    this.loadApplications();
  }

  onUsersPageChange(page: number): void {
    console.log('Admin Dashboard: Users page change to:', page);
    this.usersPaginationState.currentPage = page;
    this.loadUsers();
  }

  onSkillApprovalsPageChange(page: number): void {
    console.log('Admin Dashboard: Skill approvals page change to:', page);
    this.skillApprovalsPaginationState.currentPage = page;
    this.loadSkillApprovals();
  }

  getSkillCategories(): Observable<string[]> {
    return this.adminService.getSkillCategories();
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

  getVendorName(vendorId: string): string {
    const user = this.allUsers.find(u => u._id === vendorId);
    if (!user) return 'Unknown Vendor';
    return user.businessInfo?.companyName || 'Unknown Vendor';
  }

  // Helper methods for user management
  getUserResourceCount(user: User): number {
    return this.allResources.filter(r => r.vendorId === user._id).length;
  }

  getUserRequirementCount(user: User): number {
    return this.allRequirements.filter(r => r.clientId === user._id).length;
  }

  getUserVendorApplicationCount(user: User): number {
    return this.allApplications.filter(a => a.vendorId === user._id).length;
  }

  getUserClientApplicationCount(user: User): number {
    return this.allApplications.filter(a => a.clientId === user._id).length;
  }

  // Stats calculations
  getGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  isGrowthPositive(growth: number): boolean {
    return growth > 0;
  }

  // Check if reject notes are valid
  isRejectNotesValid(): boolean {
    return this.rejectNotes.trim().length > 0;
  }

  isSkillRejectNotesValid(): boolean {
    return this.skillRejectNotes.trim().length > 0;
  }

  // Helper method to get pending vendor skills for template
  getPendingVendorSkills(): VendorSkill[] {
    return this.skillApprovals.map(a => a.skill).slice(0, 5);
  }

  // Helper method to check if pending vendor skills exist
  hasPendingVendorSkills(): boolean {
    return this.skillApprovals.length > 0;
  }

  getUserTypeColor(userType: string): string {
    switch (userType) {
      case 'vendor':
        return 'bg-blue-100 text-blue-600';
      case 'client':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getUserTypeIcon(userType: string): string {
    switch (userType) {
      case 'vendor':
        return 'store';
      case 'client':
        return 'user';
      default:
        return 'user';
    }
  }

  onFilterChange(): void {
    // Reset pagination states when filters change
    this.applicationsPaginationState.currentPage = 1;
    this.usersPaginationState.currentPage = 1;
    this.skillApprovalsPaginationState.currentPage = 1;
    
    this.loadTabData();
  }

  editSkill(skill: AdminSkill): void {
    // TODO: Implement skill editing
    console.log('Edit skill:', skill);
  }

  editUser(user: User): void {
    // TODO: Implement user editing
    console.log('Edit user:', user);
  }

  toggleUserStatus(user: User): void {
    // TODO: Implement user status toggle
    console.log('Toggle user status:', user);
  }

  // Computed properties for template bindings
  get pendingUserApprovalsCount(): number {
    return this.userApprovals.filter(a => a.approvalStatus === 'pending').length;
  }

  get pendingSkillApprovalsCount(): number {
    return this.skillApprovals.filter(a => a.status === 'pending').length;
  }

  get filteredUserApprovals(): UserApproval[] {
    if (this.approvalFilter === 'all') return this.userApprovals;
    return this.userApprovals.filter(a => a.approvalStatus === this.approvalFilter);
  }

  get filteredSkillApprovals(): SkillApproval[] {
    if (this.skillApprovalFilter === 'all') return this.skillApprovals;
    return this.skillApprovals.filter(a => a.status === this.skillApprovalFilter);
  }

  onSkillAdded(newSkill: AdminSkill): void {
    // Add the new skill to the list
    this.adminSkills = [...this.adminSkills, newSkill];
    
    // Update platform stats
    this.platformStats = {
      ...this.platformStats,
      activeSkills: this.platformStats.activeSkills + 1
    };
  }

  getApplicationTitle(application: any): string {
    if (this.isObject(application.resource)) {
      return application.resource.name || 'Resource';
    }
    if (this.isObject(application.requirement)) {
      return application.requirement.title || 'Requirement';
    }
    return 'Unknown';
  }

  getApplicationCreator(application: any): string {
    if (this.isObject(application.createdBy)) {
      const firstName = application.createdBy.firstName || '';
      const lastName = application.createdBy.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    }
    return 'User';
  }

  private updateApplicationsPagination(paginationData: any): void {
    this.applicationsPaginationState.currentPage = paginationData.page;
    this.applicationsPaginationState.pageSize = paginationData.limit;
    this.applicationsPaginationState.totalItems = paginationData.total;
    this.applicationsPaginationState.totalPages = paginationData.pages;
    this.applicationsPaginationState.hasNextPage = paginationData.hasNextPage;
    this.applicationsPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }

  private updateUsersPagination(paginationData: any): void {
    this.usersPaginationState.currentPage = paginationData.page;
    this.usersPaginationState.pageSize = paginationData.limit;
    this.usersPaginationState.totalItems = paginationData.total;
    this.usersPaginationState.totalPages = paginationData.pages;
    this.usersPaginationState.hasNextPage = paginationData.hasNextPage;
    this.usersPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }

  private updateSkillApprovalsPagination(paginationData: any): void {
    this.skillApprovalsPaginationState.currentPage = paginationData.page;
    this.skillApprovalsPaginationState.pageSize = paginationData.limit;
    this.skillApprovalsPaginationState.totalItems = paginationData.total;
    this.skillApprovalsPaginationState.totalPages = paginationData.pages;
    this.skillApprovalsPaginationState.hasNextPage = paginationData.hasNextPage;
    this.skillApprovalsPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }
}