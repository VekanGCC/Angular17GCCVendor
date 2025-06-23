import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent {
  @Input() users: User[] = [];
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() editUser = new EventEmitter<User>();

  constructor() {}

  getUserTypeColor(userType: string): string {
    const colors: { [key: string]: string } = {
      vendor: 'text-blue-600 bg-blue-100',
      client: 'text-purple-600 bg-purple-100',
      admin: 'text-red-600 bg-red-100'
    };
    return colors[userType] || 'text-gray-600 bg-gray-100';
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onEditUser(user: User): void {
    this.editUser.emit(user);
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 