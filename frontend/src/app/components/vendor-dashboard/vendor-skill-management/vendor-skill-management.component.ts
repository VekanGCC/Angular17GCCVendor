import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-vendor-skill-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './vendor-skill-management.component.html',
  styleUrls: ['./vendor-skill-management.component.scss']
})
export class VendorSkillManagementComponent {
  @Input() skills: any[] = [];
  @Input() isLoading = false;
  @Output() openAddSkillModal = new EventEmitter<void>();

  constructor() {}

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

  trackById(index: number, item: any): string {
    return item._id || `skill-${index}`;
  }
} 