export interface VendorSkill {
  _id: string;
  vendor: {
    _id: string;
    email: string;
    companyName: string;
    firstName: string;
    lastName: string;
  };
  skillName: string;
  category: string;
  description: string;
  yearsOfExperience: number;
  proficiency: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}