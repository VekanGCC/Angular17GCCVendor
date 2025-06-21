export interface Resource {
  _id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: string;
  skills: string[];
  experience: {
    years: number;
    level: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  };
  availability: {
    status: 'available' | 'partially_available' | 'unavailable';
    hours_per_week: number;
    start_date: string;
  };
  rate: {
    hourly: number;
    currency: string;
  };
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachment?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId?: string;
    filename?: string;
    path?: string;
  };
}