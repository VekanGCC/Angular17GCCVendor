import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Requirement } from '../../../models/requirement.model';

@Component({
  selector: 'app-client-requirements',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './client-requirements.component.html',
  styleUrls: ['./client-requirements.component.scss']
})
export class ClientRequirementsComponent {
  @Input() requirements: Requirement[] = [];
  @Input() isLoading = false;
  @Output() openRequirementModal = new EventEmitter<void>();
  @Output() openCloseRequirementModal = new EventEmitter<Requirement>();
  @Output() openEditRequirementModal = new EventEmitter<Requirement>();

  constructor() {}

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
      case 'closed':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800';
      case 'in progress':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      default:
        return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  getExperienceLevel(requirement: Requirement): string {
    return requirement.experience?.level || 'Not specified';
  }

  getExperienceYears(requirement: Requirement): number {
    return requirement.experience?.minYears || 0;
  }

  getLocation(requirement: Requirement): string {
    const city = requirement.location?.city || 'N/A';
    const state = requirement.location?.state || 'N/A';
    return `${city}, ${state}`;
  }

  onOpenRequirementModal(): void {
    this.openRequirementModal.emit();
  }

  onOpenCloseRequirementModal(requirement: Requirement): void {
    this.openCloseRequirementModal.emit(requirement);
  }

  onOpenEditRequirementModal(requirement: Requirement): void {
    this.openEditRequirementModal.emit(requirement);
  }

  trackById(index: number, item: Requirement): string {
    return item._id || `requirement-${index}`;
  }

  trackBySkill(index: number, skill: string): string {
    return skill || `skill-${index}`;
  }
} 