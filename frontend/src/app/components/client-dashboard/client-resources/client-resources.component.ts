import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../models/resource.model';

@Component({
  selector: 'app-client-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-resources.component.html',
  styleUrls: ['./client-resources.component.scss']
})
export class ClientResourcesComponent implements OnInit {
  @Input() resources: Resource[] = [];
  @Input() isLoading = false;
  @Output() applyResources = new EventEmitter<string[]>();

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    users: 'assets/icons/lucide/lucide/users.svg'
  };

  selectedResources: Set<string> = new Set();
  showApplyButton = false;

  constructor() {}

  ngOnInit(): void {}

  onApplyResource(resourceId: string): void {
    // Single resource apply (keeping backward compatibility)
    this.applyResources.emit([resourceId]);
  }

  onApplySelectedResources(): void {
    // Multi-resource apply
    const selectedResourceIds = Array.from(this.selectedResources);
    this.applyResources.emit(selectedResourceIds);
  }

  toggleResourceSelection(resourceId: string): void {
    if (this.selectedResources.has(resourceId)) {
      this.selectedResources.delete(resourceId);
    } else {
      this.selectedResources.add(resourceId);
    }
    this.showApplyButton = this.selectedResources.size > 0;
  }

  isResourceSelected(resourceId: string): boolean {
    return this.selectedResources.has(resourceId);
  }

  getSelectedCount(): number {
    return this.selectedResources.size;
  }

  clearSelection(): void {
    this.selectedResources.clear();
    this.showApplyButton = false;
  }

  toggleAllResources(event: any): void {
    if (event.target.checked) {
      // Select all resources
      this.resources.forEach(resource => {
        this.selectedResources.add(resource._id);
      });
    } else {
      // Deselect all resources
      this.selectedResources.clear();
    }
    this.showApplyButton = this.selectedResources.size > 0;
  }
} 