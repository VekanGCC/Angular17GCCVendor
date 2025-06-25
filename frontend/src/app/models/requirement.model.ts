export interface Requirement {
  _id: string;
  clientId: string;
  clientName: string;
  title: string;
  category: string;
  skills: string[];
  experience: {
    minYears: number;
    level: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  };
  duration: string;
  budget: {
    charge: number;
    currency: string;
    type: string;
  };
  description: string;
  status: 'draft' | 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  attachment?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId?: string;
    filename?: string;
    path?: string;
  };
  applicationCount?: number;
  matchingResourcesCount?: number;
}