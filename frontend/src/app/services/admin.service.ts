import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { AdminSkill, PlatformStats, TransactionData } from '../models/admin.model';
import { VendorSkill } from '../models/vendor-skill.model';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/pagination.model';

interface UserApproval {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewNotes?: string;
}

interface SkillApproval {
  id: string;
  skill: VendorSkill;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private userApprovalsSubject = new BehaviorSubject<ApiResponse<UserApproval[]>>({
    success: true,
    data: []
  });
  private skillApprovalsSubject = new BehaviorSubject<ApiResponse<SkillApproval[]>>({
    success: true,
    data: []
  });
  private adminSkillsSubject = new BehaviorSubject<AdminSkill[]>([]);
  private platformStatsSubject = new BehaviorSubject<PlatformStats>({
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
  });
  private transactionsSubject = new BehaviorSubject<TransactionData[]>([]);
  private applicationsSubject = new BehaviorSubject<any[]>([]);

  userApprovals$ = this.userApprovalsSubject.asObservable();
  skillApprovals$ = this.skillApprovalsSubject.asObservable();
  adminSkills$ = this.adminSkillsSubject.asObservable();
  platformStats$ = this.platformStatsSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  applications$ = this.applicationsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getUsers(page: number, limit: number): Observable<ApiResponse<User[]>> {
    return this.apiService.get<ApiResponse<User[]>>(`/admin/users?page=${page}&limit=${limit}`).pipe(
      map(response => {
        console.log('Admin Service: Users response:', response);
        // Ensure pagination data is present
        if (!response.pagination && response.data) {
          response.pagination = {
            total: response.data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(response.data.length / limit)
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching users:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to fetch users',
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
      })
    );
  }

  getUserApprovals(page: number, limit: number): Observable<ApiResponse<UserApproval[]>> {
    return this.apiService.get<ApiResponse<UserApproval[]>>(`/admin/user-approvals?page=${page}&limit=${limit}`).pipe(
      map(response => {
        this.userApprovalsSubject.next(response);
        return response;
      })
    );
  }

  getSkillApprovals(page: number, limit: number): Observable<ApiResponse<SkillApproval[]>> {
    return this.apiService.get<ApiResponse<SkillApproval[]>>(`/admin/skill-approvals?page=${page}&limit=${limit}`).pipe(
      map(response => {
        this.skillApprovalsSubject.next(response);
        return response;
      })
    );
  }

  getAdminSkills(): Observable<ApiResponse<AdminSkill[]>> {
    return this.apiService.getAdminSkills().pipe(
      map(response => {
        console.log('Admin Service: Skills response:', response);
        if (response.success) {
          this.adminSkillsSubject.next(response.data);
        }
        return response;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching skills:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to load skills'
        });
      })
    );
  }

  getPlatformStats(): Observable<PlatformStats> {
    return this.apiService.get<PlatformStats>('/admin/stats').pipe(
      map(stats => {
        this.platformStatsSubject.next(stats);
        return stats;
      })
    );
  }

  getTransactions(): Observable<TransactionData[]> {
    return this.apiService.get<TransactionData[]>('/admin/transactions').pipe(
      map(transactions => {
        this.transactionsSubject.next(transactions);
        return transactions;
      })
    );
  }

  getApplications(page: number, limit: number): Observable<ApiResponse<any[]>> {
    return this.apiService.getApplications({ page, limit }).pipe(
      map(response => {
        console.log('Admin Service: Applications response:', response);
        this.applicationsSubject.next(response.data);
        // Convert PaginatedResponse to ApiResponse format
        return {
          success: response.success,
          data: response.data,
          message: response.message,
          pagination: response.pagination || response.meta
        };
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching applications:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to load applications',
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
      })
    );
  }

  approveUser(userId: string): Observable<ApiResponse<UserApproval>> {
    return this.apiService.post<ApiResponse<UserApproval>>(`/admin/user-approvals/${userId}/approve`, {});
  }

  rejectUser(userId: string, notes: string): Observable<ApiResponse<UserApproval>> {
    return this.apiService.post<ApiResponse<UserApproval>>(`/admin/user-approvals/${userId}/reject`, { notes });
  }

  approveSkill(skillId: string): Observable<ApiResponse<SkillApproval>> {
    return this.apiService.post<ApiResponse<SkillApproval>>(`/admin/skill-approvals/${skillId}/approve`, {});
  }

  rejectSkill(skillId: string, notes: string): Observable<ApiResponse<SkillApproval>> {
    return this.apiService.post<ApiResponse<SkillApproval>>(`/admin/skill-approvals/${skillId}/reject`, { notes });
  }

  updateSkill(skillId: string, skill: Partial<AdminSkill>): Observable<AdminSkill> {
    return this.apiService.put<AdminSkill>(`/admin/skills/${skillId}`, skill);
  }

  deleteSkill(skillId: string): Observable<void> {
    return this.apiService.delete<void>(`/admin/skills/${skillId}`);
  }

  updateUser(userId: string, user: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`/admin/users/${userId}`, user);
  }

  toggleUserStatus(userId: string): Observable<User> {
    return this.apiService.post<User>(`/admin/users/${userId}/toggle-status`, {});
  }

  getSkillCategories(): Observable<string[]> {
    return this.apiService.get<string[]>('/admin/skill-categories');
  }

  addAdminSkill(skill: Omit<AdminSkill, 'id' | 'createdAt' | 'updatedAt'>): Observable<ApiResponse<AdminSkill>> {
    return this.apiService.post<ApiResponse<AdminSkill>>('/admin/skills', skill);
  }
}