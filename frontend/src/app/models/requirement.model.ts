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
    hourly: number;
    currency: string;
  };
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
}