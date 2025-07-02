import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Application } from '../models/application.model';
import { VendorService } from './vendor.service';

export interface ApplicationModalAction {
  type: 'viewHistory' | 'viewDetails';
  applicationId?: string;
  application?: Application;
  history?: any[];
  applicationDetails?: any;
}

@Injectable({
  providedIn: 'root'
})
export class VendorApplicationsService {
  private modalActionSubject = new Subject<ApplicationModalAction>();
  public modalAction$ = this.modalActionSubject.asObservable();

  constructor(private vendorService: VendorService) {}

  viewApplicationHistory(applicationId: string): void {
    console.log('🔧 VendorApplicationsService: Opening history modal for application:', applicationId);
    this.vendorService.getApplicationHistory(applicationId).subscribe({
      next: (response) => {
        console.log('🔧 VendorApplicationsService: History response:', response);
        this.modalActionSubject.next({
          type: 'viewHistory',
          applicationId,
          history: response.data?.history || [],
          applicationDetails: response.data?.application || null
        });
      },
      error: (error) => {
        console.error('🔧 VendorApplicationsService: Error fetching application history:', error);
      }
    });
  }

  viewApplicationDetails(application: Application): void {
    console.log('🔧 VendorApplicationsService: Opening details modal for application:', application._id);
    this.modalActionSubject.next({
      type: 'viewDetails',
      application
    });
  }
} 