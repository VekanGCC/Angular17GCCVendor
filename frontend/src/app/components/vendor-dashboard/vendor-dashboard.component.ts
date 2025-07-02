import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { LayoutComponent } from '../layout/layout.component';
import { VendorApplicationsService } from '../../services/vendor-applications.service';
import { ApplicationHistoryModalComponent } from '../modals/application-history-modal/application-history-modal.component';


@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutComponent,
    ApplicationHistoryModalComponent
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showMobileMenu = false;
  showFinanceManagementSubmenu = false;

  // Application History Modal State
  showHistoryModal = false;
  selectedApplicationId: string = '';
  isLoadingHistory = false;
  applicationHistory: any[] = [];
  applicationDetails: any = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private vendorApplicationsService: VendorApplicationsService
  ) {}

  ngOnInit(): void {
    console.log('🔄 VendorDashboard: Initializing layout component...');
    
    // Check authentication and initialize
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.userType !== 'vendor') {
      this.router.navigate(['/']);
      return;
    }

    this.currentUser = user;

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

    // Subscribe to route changes to debug routing issues
    this.subscriptions.push(
      this.router.events.subscribe(event => {
        console.log('🔄 VendorDashboard: Router event:', event);
        console.log('🔄 VendorDashboard: Current URL:', this.router.url);
      })
    );

    // Subscribe to application modal actions
    this.subscriptions.push(
      this.vendorApplicationsService.modalAction$.subscribe(action => {
        console.log('🔧 VendorDashboard: Received modal action:', action);
        if (action.type === 'viewHistory' && action.applicationId) {
          if (action.history && action.applicationDetails) {
            // Use the data provided by the service
            this.handleViewHistory({
              applicationId: action.applicationId,
              history: action.history,
              applicationDetails: action.applicationDetails
            });
          } else {
            // Fallback to loading data manually
            this.handleViewApplicationHistory(action.applicationId);
          }
        } else if (action.type === 'viewDetails' && action.application) {
          this.handleViewApplicationDetails(action.application);
        }
      })
    );

  }

  // Navigation methods
  navigateToTab(tabId: string): void {
    console.log('🔄 VendorDashboard: Navigating to tab:', tabId);
    this.router.navigate(['/vendor', tabId]);
    this.showMobileMenu = false; // Close mobile menu on navigation
  }

  // Layout methods
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleFinanceManagementSubmenu(): void {
    this.showFinanceManagementSubmenu = !this.showFinanceManagementSubmenu;
  }

  // User management
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Get available menu items based on user role
  getAvailableMenuItems(): any[] {
    const allMenuItems = [
      { id: 'overview', label: 'Overview', icon: 'home.svg', route: '/vendor/overview' },
      { id: 'requirements', label: 'Browse Requirements', icon: 'briefcase.svg', route: '/vendor/requirements' },
      { id: 'resources', label: 'My Resources', icon: 'users.svg', route: '/vendor/resources' },
      { id: 'applications', label: 'Vendor Applications', icon: 'trending-up.svg', route: '/vendor/applications' },
      { 
        id: 'finance-management', 
        label: 'Finance Management', 
        icon: 'dollar-sign.svg', 
        hasSubmenu: true,
        submenu: [
          { id: 'sow-approvals', label: 'SOW Approval', route: '/vendor/sow-approvals' },
          { id: 'po-approvals', label: 'PO Approval', route: '/vendor/po-approvals' },
          { id: 'invoice-management', label: 'Invoice Management', route: '/vendor/invoice-management' }
        ],
        roles: ['vendor_account', 'vendor_owner']
      },
      { id: 'skill-management', label: 'Skills Management', icon: 'settings.svg', route: '/vendor/skill-management' },
      { id: 'user-management', label: 'User Management', icon: 'user-plus.svg', route: '/vendor/user-management' },
      { id: 'profile', label: 'Profile', icon: 'user.svg', route: '/vendor/profile' }
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

  // Check if current route is active
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Add this method (replaces the modal approach)
  handleApplyResources(requirementId: string): void {
    console.log('🔄 VendorDashboard: Applying resources to requirement:', requirementId);
    console.log('🔄 VendorDashboard: Current URL before navigation:', this.router.url);
    
    // Navigate to the apply-requirement-page route with requirementId as query parameter
    this.router.navigate(['/vendor/apply-requirement-page'], { 
      queryParams: { requirementId: requirementId } 
    }).then(() => {
      console.log('🔄 VendorDashboard: Navigation completed successfully');
      console.log('🔄 VendorDashboard: New URL after navigation:', this.router.url);
    }).catch(error => {
      console.error('🔄 VendorDashboard: Navigation error:', error);
    });
  }

  // Application History Methods
  handleViewHistory(data: {
    applicationId: string;
    history: any[];
    applicationDetails: any;
  }): void {
    console.log('🔧 VendorDashboard: handleViewHistory called with data:', data);
    this.selectedApplicationId = data.applicationId;
    this.applicationHistory = data.history;
    this.applicationDetails = data.applicationDetails;
    this.showHistoryModal = true;
    this.isLoadingHistory = false;
    // Force change detection to ensure the modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  handleViewApplicationHistory(applicationId: string): void {
    console.log('🔧 VendorDashboard: handleViewApplicationHistory called for:', applicationId);
    this.selectedApplicationId = applicationId;
    this.showHistoryModal = true;
    this.isLoadingHistory = true;
    this.applicationHistory = [];
    this.applicationDetails = null;
    // Force change detection to ensure the modal opens immediately
    this.changeDetectorRef.detectChanges();
  }

  handleViewApplicationDetails(application: any): void {
    console.log('🔧 VendorDashboard: handleViewApplicationDetails called for:', application._id);
    // TODO: Implement application details modal
  }

  closeHistoryModal(): void {
    console.log('🔧 VendorDashboard: closeHistoryModal called');
    this.showHistoryModal = false;
    this.selectedApplicationId = '';
    this.applicationHistory = [];
    this.applicationDetails = null;
    this.isLoadingHistory = false;
    console.log('🔧 VendorDashboard: Modal closed, showHistoryModal = false');
    // Force change detection to ensure UI updates immediately
    this.changeDetectorRef.detectChanges();
  }
}