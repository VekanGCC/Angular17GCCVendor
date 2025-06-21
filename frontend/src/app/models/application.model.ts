import { Resource } from './resource.model';
import { Requirement } from './requirement.model';
import { User } from './user.model';

export interface Application {
  _id: string;
  resource: Resource | string; // Can be populated object or just ID
  requirement: Requirement | string; // Can be populated object or just ID
  createdBy: User | string; // Can be populated object or just ID
  status: 'applied' | 'pending' | 'shortlisted' | 'interview' | 'accepted' | 'rejected' | 'offer_created' | 'onboarded' | 'did_not_join' | 'withdrawn';
  notes?: string;
  proposedRate?: {
    amount: number;
    currency: string;
    type: 'hourly' | 'fixed';
  };
  availability?: {
    startDate: Date;
    hoursPerWeek: number;
  };
  createdAt: string;
  updatedAt: string;
  
  // Legacy fields for backward compatibility
  resourceId?: string;
  requirementId?: string;
  vendorId?: string;
  clientId?: string;
  appliedBy?: 'vendor' | 'client';
}

export type ApplicationStatus = Application['status'];