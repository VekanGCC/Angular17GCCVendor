import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VendorUser } from '../models/vendor-user.model';
import { VendorSkill } from '../models/vendor-skill.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VendorManagementService {
  private vendorUsersSubject = new BehaviorSubject<VendorUser[]>([]);
  private vendorSkillsSubject = new BehaviorSubject<VendorSkill[]>([]);

  public vendorUsers$ = this.vendorUsersSubject.asObservable();
  public vendorSkills$ = this.vendorSkillsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadVendorUsers(),
        this.loadVendorSkills()
      ]);
    } catch (error) {
      console.error('Error loading vendor management data:', error);
    }
  }

  private async loadVendorUsers(): Promise<void> {
    try {
      const response = await this.apiService.getVendorUsers().toPromise();
      if (response && response.success && response.data) {
        console.log('✅ Loaded vendor users:', response.data.length);
        this.vendorUsersSubject.next(response.data);
      } else {
        console.log('⚠️ No vendor users data received');
        this.vendorUsersSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading vendor users:', error);
      this.vendorUsersSubject.next([]);
    }
  }

  private async loadVendorSkills(): Promise<void> {
    try {
      const response = await this.apiService.getVendorSkills().toPromise();
      if (response && response.success && response.data) {
        console.log('✅ Loaded vendor skills:', response.data.length);
        this.vendorSkillsSubject.next(response.data);
      } else {
        console.log('⚠️ No vendor skills data received');
        this.vendorSkillsSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading vendor skills:', error);
      this.vendorSkillsSubject.next([]);
    }
  }

  async addVendorUser(userData: Omit<VendorUser, 'id' | 'createdAt'>): Promise<void> {
    try {
      const response = await this.apiService.createVendorUser(userData).toPromise();
      if (response.success) {
        const currentUsers = this.vendorUsersSubject.value;
        this.vendorUsersSubject.next([...currentUsers, response.data]);
      }
    } catch (error) {
      console.error('Error adding vendor user:', error);
      throw error;
    }
  }

  async addVendorSkill(skillData: Omit<VendorSkill, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await this.apiService.createVendorSkill(skillData).toPromise();
      if (response.success) {
        const currentSkills = this.vendorSkillsSubject.value;
        this.vendorSkillsSubject.next([...currentSkills, response.data]);
      }
    } catch (error) {
      console.error('Error adding vendor skill:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: VendorUser['status']): Promise<void> {
    try {
      const response = await this.apiService.updateVendorUserStatus(userId, status).toPromise();
      if (response.success) {
        const currentUsers = this.vendorUsersSubject.value;
        const updatedUsers = currentUsers.map(user => 
          user.id === userId ? { ...user, status } : user
        );
        this.vendorUsersSubject.next(updatedUsers);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateSkillStatus(skillId: string, status: VendorSkill['status'], reviewNotes?: string): Promise<void> {
    try {
      const response = await this.apiService.updateVendorSkillStatus(skillId, status, reviewNotes).toPromise();
      if (response.success) {
        const currentSkills = this.vendorSkillsSubject.value;
        const updatedSkills = currentSkills.map(skill => 
          skill._id === skillId 
            ? { 
                ...skill, 
                status
              } 
            : skill
        );
        this.vendorSkillsSubject.next(updatedSkills);
      }
    } catch (error) {
      console.error('Error updating skill status:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, currentStatus: VendorUser['status']): Promise<void> {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await this.updateUserStatus(userId, newStatus);
  }

  get vendorUsers(): VendorUser[] {
    return this.vendorUsersSubject.value;
  }

  get vendorSkills(): VendorSkill[] {
    return this.vendorSkillsSubject.value;
  }
}