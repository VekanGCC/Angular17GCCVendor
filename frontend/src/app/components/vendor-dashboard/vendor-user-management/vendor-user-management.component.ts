import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendor-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendor-user-management.component.html',
  styleUrls: ['./vendor-user-management.component.scss']
})
export class VendorUserManagementComponent {
  @Input() users: any[] = [];
  @Input() isLoading = false;
  @Output() openAddUserModal = new EventEmitter<void>();
  @Output() toggleUserStatus = new EventEmitter<{id: string, status: string}>();

  constructor() {}

  getUserRoleClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onOpenAddUserModal(): void {
    this.openAddUserModal.emit();
  }

  onToggleUserStatus(id: string, status: string): void {
    this.toggleUserStatus.emit({id, status});
  }

  trackById(index: number, item: any): string {
    return item.id || `user-${index}`;
  }
} 