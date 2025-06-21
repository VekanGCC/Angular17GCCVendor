export interface VendorSkill {
  id: string;
  vendorId: string;
  skillName: string;
  category: string;
  description: string;
  proficiencyLevel: string;
  yearsOfExperience: number;
  certifications: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}