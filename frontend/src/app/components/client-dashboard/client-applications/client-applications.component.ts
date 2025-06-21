import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Application } from '../../../models/application.model';

@Component({
  selector: 'app-client-applications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './client-applications.component.html',
  styleUrls: ['./client-applications.component.scss']
})
export class ClientApplicationsComponent implements OnInit {
  @Input() applications: Application[] = [];
  @Output() updateApplicationStatus = new EventEmitter<{applicationId: string, status: string, notes?: string}>();
  @Output() viewApplicationHistory = new EventEmitter<string>();
  @Output() viewApplicationDetails = new EventEmitter<Application>();

  availableStatuses = [
    { value: 'applied', label: 'Applied', color: 'bg-gray-100 text-gray-800' },
    { value: 'shortlisted', label: 'Shortlist', color: 'bg-blue-100 text-blue-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Reject', color: 'bg-red-100 text-red-800' },
    { value: 'accepted', label: 'Accept', color: 'bg-green-100 text-green-800' },
    { value: 'offer_created', label: 'Create Offer', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'onboarded', label: 'Onboarded', color: 'bg-teal-100 text-teal-800' },
    { value: 'did_not_join', label: 'Did Not Join', color: 'bg-orange-100 text-orange-800' }
  ];

  constructor() {}

  ngOnInit(): void {}

  getApplicationResourceName(app: any): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: any): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    switch (status.toLowerCase()) {
      case 'applied':
        return { color: 'bg-gray-100 text-gray-800', icon: 'file-text' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' };
      case 'shortlisted':
        return { color: 'bg-blue-100 text-blue-800', icon: 'check' };
      case 'interview':
        return { color: 'bg-purple-100 text-purple-800', icon: 'users' };
      case 'accepted':
        return { color: 'bg-green-100 text-green-800', icon: 'check-circle' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'x-circle' };
      case 'offer_created':
        return { color: 'bg-indigo-100 text-indigo-800', icon: 'file-text' };
      case 'onboarded':
        return { color: 'bg-teal-100 text-teal-800', icon: 'plus' };
      case 'did_not_join':
        return { color: 'bg-orange-100 text-orange-800', icon: 'x' };
      case 'withdrawn':
        return { color: 'bg-gray-100 text-gray-800', icon: 'x' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'help-circle' };
    }
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getResourceName(app: Application): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_created':
        return 'bg-indigo-100 text-indigo-800';
      case 'onboarded':
        return 'bg-teal-100 text-teal-800';
      case 'did_not_join':
        return 'bg-orange-100 text-orange-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackById(index: number, item: Application): string {
    return item._id || `application-${index}`;
  }

  onStatusChange(applicationId: string, newStatus: string): void {
    this.updateApplicationStatus.emit({ applicationId, status: newStatus });
  }

  onViewHistory(applicationId: string): void {
    this.viewApplicationHistory.emit(applicationId);
  }

  onViewDetails(application: Application): void {
    this.viewApplicationDetails.emit(application);
  }

  getAvailableStatuses(currentStatus: string): any[] {
    // Filter out the current status and return available options
    return this.availableStatuses.filter(status => status.value !== currentStatus);
  }
} 