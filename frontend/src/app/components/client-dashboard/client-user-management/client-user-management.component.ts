import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-client-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-user-management.component.html',
  styleUrls: ['./client-user-management.component.scss']
})
export class ClientUserManagementComponent {
  @Input() users: User[] = [];
  @Input() isLoading: boolean = false;
  @Output() openAddUserModal = new EventEmitter<void>();
  @Output() toggleUserStatus = new EventEmitter<{id: string, status: string}>();

  getUserRoleClass(role: string): string {
    switch (role) {
      case 'client_owner':
        return 'bg-purple-100 text-purple-800';
      case 'client_employee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserStatusClass(status: boolean): string {
    switch (status) {
      case true:
        return 'bg-green-100 text-green-800';
      case false:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatRole(role: string): string {
    switch (role) {
      case 'client_owner':
        return 'Client Owner';
      case 'client_employee':
        return 'Client Employee';
      default:
        return role || 'Unknown Role';
    }
  }

  formatStatus(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  onToggleUserStatus(userId: string, currentStatus: boolean): void {
    this.toggleUserStatus.emit({ id: userId, status: currentStatus ? 'active' : 'inactive' });
  }

  onOpenAddUserModal(): void {
    this.openAddUserModal.emit();
  }

  trackById(index: number, item: any): any {
    return item?._id || index;
  }
} 