import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProfileService, ProfileData } from '../../services/profile.service';
import { User as UserModel, UserAddress } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.css']
})
export class ProfileDashboardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() userId?: string; // Optional userId for admin use
  @Input() isAdminView: boolean = false; // Flag to indicate if this is admin view
  @Input() refreshTrigger: number = 0; // Trigger to refresh profile data
  
  @Output() backToUsers = new EventEmitter<void>();
  @Output() approveUser = new EventEmitter<User>();
  @Output() rejectUser = new EventEmitter<{user: User, notes: string}>();
  
  profileData: ProfileData | null = null;
  isLoading = false;
  activeTab: 'personal' | 'addresses' | 'bank' | 'compliance' = 'personal';
  showRejectModal = false;
  rejectNotes = '';

  // Define the tab list as a type-safe array
  tabList: { value: 'personal' | 'addresses' | 'bank' | 'compliance', label: string }[] = [
    { value: 'personal', label: 'Personal' },
    { value: 'addresses', label: 'Addresses' },
    { value: 'bank', label: 'Bank' },
    { value: 'compliance', label: 'Compliance' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadProfileData();
    }
  }

  loadProfileData(): void {
    this.isLoading = true;
    
    if (this.isAdminView && this.userId) {
      // Load specific user's profile for admin view
      this.subscriptions.push(
        this.adminService.getUserProfile(this.userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.profileData = response.data;
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading user profile:', error);
            this.isLoading = false;
          }
        })
      );
    } else {
      // Load current user's profile
      this.subscriptions.push(
        this.profileService.getProfile().subscribe({
          next: (data) => {
            this.profileData = data;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
          }
        })
      );
    }
  }

  setActiveTab(tab: 'personal' | 'addresses' | 'bank' | 'compliance'): void {
    this.activeTab = tab;
  }

  isVendor(): boolean {
    return this.profileData?.user.userType === 'vendor';
  }

  getDefaultAddress(): UserAddress | null {
    return this.profileData?.addresses.find(addr => addr.isDefault) || null;
  }

  // Admin-only methods
  onBackToUsers(): void {
    this.backToUsers.emit();
  }

  onApproveUser(): void {
    if (this.profileData?.user) {
      this.approveUser.emit(this.profileData.user);
    }
  }

  onOpenRejectModal(): void {
    this.showRejectModal = true;
    this.rejectNotes = '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectNotes = '';
  }

  onRejectUser(): void {
    if (this.profileData?.user && this.rejectNotes.trim()) {
      this.rejectUser.emit({ user: this.profileData.user, notes: this.rejectNotes });
      this.onCloseRejectModal();
    }
  }

  // Method to refresh profile data (called after approve/reject)
  refreshProfileData(): void {
    if (this.isAdminView && this.userId) {
      this.loadProfileData();
    }
  }

  // Check if current user is admin
  isCurrentUserAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.userType === 'admin';
  }
} 