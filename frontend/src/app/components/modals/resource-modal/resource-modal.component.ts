import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { AppService } from '../../../services/app.service';
import { AdminService } from '../../../services/admin.service';
import { AdminSkill } from '../../../models/admin.model';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-resource-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './resource-modal.component.html',
  styleUrls: ['./resource-modal.component.css']
})
export class ResourceModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  resourceForm: FormGroup;
  availableSkills: AdminSkill[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appService: AppService,
    private adminService: AdminService,
    private apiService: ApiService
  ) {
    this.resourceForm = this.fb.group({
      name: ['', Validators.required],
      category: ['developer', Validators.required],
      skills: this.fb.array([this.fb.control('', Validators.required)]),
      experience: this.fb.group({
        years: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
        level: ['junior', Validators.required]
      }),
      location: this.fb.group({
        city: [''],
        state: [''],
        country: [''],
        remote: [true]
      }),
      availability: this.fb.group({
        status: ['available', Validators.required],
        hours_per_week: [40, [Validators.min(0), Validators.max(168)]],
        start_date: ['']
      }),
      rate: this.fb.group({
        hourly: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
        currency: ['USD']
      }),
      description: ['', Validators.required],
      status: ['active']
    });
  }

  ngOnInit(): void {
    // Load available skills from admin service
    this.apiService.getActiveSkills().subscribe({
      next: (response) => {
        console.log('Resource Modal: Skills response:', response);
        if (response.success) {
          this.availableSkills = response.data;
        } else {
          console.error('Resource Modal: Failed to load skills:', response.message);
        }
      },
      error: (error) => {
        console.error('Resource Modal: Error loading skills:', error);
      }
    });
  }

  get skills(): FormArray {
    return this.resourceForm.get('skills') as FormArray;
  }

  addSkill(): void {
    this.skills.push(this.fb.control('', Validators.required));
  }

  removeSkill(index: number): void {
    if (this.skills.length > 1) {
      this.skills.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.resourceForm.valid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.resourceForm.value;
      const filteredSkills = formValue.skills.filter((skill: string) => skill.trim() !== '');

      if (filteredSkills.length === 0) return;

      this.appService.addResource({
        ...formValue,
        skills: filteredSkills,
        vendorId: user._id,
        vendorName: user.businessInfo?.companyName || 'Unknown Company',
        createdBy: user._id
      });

      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}