import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { Application } from '../../../models/application.model';

@Component({
  selector: 'app-vendor-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendor-overview.component.html',
  styleUrls: ['./vendor-overview.component.scss']
})
export class VendorOverviewComponent {
  @Input() resources: Resource[] = [];
  @Input() requirements: Requirement[] = [];
  @Input() applications: Application[] = [];
  @Input() stats: any[] = [];

  constructor() {}

  getApplicationResourceName(app: Application): string {
    if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return app.resource?.name || 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return app.requirement?.title || 'Unknown Requirement';
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'assets/icons/lucide/lucide/clock.svg' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: 'assets/icons/lucide/lucide/check-circle.svg' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'assets/icons/lucide/lucide/x-circle.svg' };
      case 'in progress':
        return { color: 'bg-blue-100 text-blue-800', icon: 'assets/icons/lucide/lucide/play-circle.svg' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'assets/icons/lucide/lucide/help-circle.svg' };
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 