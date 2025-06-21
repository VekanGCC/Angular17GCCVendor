import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProfileService, ProfileData } from '../../services/profile.service';
import { User as UserModel, UserAddress } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.css']
})
export class ProfileDashboardComponent implements OnInit, OnDestroy {
  profileData: ProfileData | null = null;
  isLoading = false;
  activeTab: 'personal' | 'addresses' | 'bank' | 'compliance' = 'personal';

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadProfileData(): void {
    this.isLoading = true;
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

  setActiveTab(tab: 'personal' | 'addresses' | 'bank' | 'compliance'): void {
    this.activeTab = tab;
  }

  isVendor(): boolean {
    return this.profileData?.user.userType === 'vendor';
  }

  getDefaultAddress(): UserAddress | null {
    return this.profileData?.addresses.find(addr => addr.isDefault) || null;
  }
} 