import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { VendorSkill } from '../../../models/vendor-skill.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vendor-skill-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './vendor-skill-management.component.html',
  styleUrls: ['./vendor-skill-management.component.scss']
})
export class VendorSkillManagementComponent implements OnInit, OnDestroy {
  @Input() skills: VendorSkill[] = [];
  @Input() isLoading = false;
  @Output() openAddSkillModal = new EventEmitter<void>();
  @Output() skillDeleted = new EventEmitter<string>();

  vendorSkills: VendorSkill[] = [];
  loadingSkills = false;
  private subscription = new Subscription();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadVendorSkills();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadVendorSkills(): void {
    this.loadingSkills = true;
    this.subscription.add(
      this.apiService.getVendorSkills().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.vendorSkills = response.data;
            console.log('🔧 VendorSkillManagement: Loaded vendor skills:', this.vendorSkills);
          }
          this.loadingSkills = false;
        },
        error: (error) => {
          console.error('Error loading vendor skills:', error);
          this.loadingSkills = false;
        }
      })
    );
  }

  onDeleteSkill(skillId: string): void {
    if (confirm('Are you sure you want to delete this skill?')) {
      this.subscription.add(
        this.apiService.deleteVendorSkill(skillId).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.vendorSkills = this.vendorSkills.filter(skill => skill._id !== skillId);
              this.skillDeleted.emit(skillId);
              console.log('🔧 VendorSkillManagement: Skill deleted successfully');
            }
          },
          error: (error: any) => {
            console.error('Error deleting skill:', error);
          }
        })
      );
    }
  }

  getProficiencyClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'expert':
        return 'bg-green-100 text-green-800';
      case 'advanced':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'beginner':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSkillStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
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

  onOpenAddSkillModal(): void {
    this.openAddSkillModal.emit();
  }

  trackById(index: number, item: VendorSkill): string {
    return item._id || `skill-${index}`;
  }
} 