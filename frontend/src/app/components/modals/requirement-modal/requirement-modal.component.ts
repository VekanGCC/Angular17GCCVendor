import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { AppService } from '../../../services/app.service';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin.model';
import { ApiResponse } from '../../../models/api-response.model';
import { FormatEnumPipe } from '../../../pipes/format-enum.pipe';
import { Requirement } from '../../../models/requirement.model';

@Component({
  selector: 'app-requirement-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, FormatEnumPipe],
  templateUrl: './requirement-modal.component.html',
  styleUrls: ['./requirement-modal.component.css']
})
export class RequirementModalComponent implements OnInit {
  @Input() requirement: Requirement | null = null;
  @Input() mode: 'create' | 'edit' | 'close' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<Requirement>();

  requirementForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  categories = [
    'development',
    'design',
    'project_management',
    'qa_testing',
    'devops',
    'data_science',
    'content_writing',
    'marketing',
    'other'
  ];
  experienceLevels = [
    'junior',
    'mid',
    'senior',
    'expert'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appService: AppService,
    private apiService: ApiService
  ) {
    this.requirementForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      skills: this.fb.array([this.fb.control('', Validators.required)]),
      experience: this.fb.group({
        minYears: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
        level: ['', Validators.required]
      }),
      location: ['', Validators.required],
      duration: [6, [Validators.required, Validators.min(1), Validators.max(36)]],
      budget: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Load available skills from API
    this.apiService.get<ApiResponse<AdminSkill[]>>('/skills/active').subscribe(response => {
      if (response.success && response.data) {
        this.availableSkills = response.data;
      }
    });

    // If in edit mode, populate the form
    if (this.mode === 'edit' && this.requirement) {
      this.requirementForm.patchValue({
        title: this.requirement.title,
        category: this.requirement.category,
        skills: this.requirement.skills,
        experience: {
          minYears: this.requirement.experience.minYears,
          level: this.requirement.experience.level
        },
        location: this.requirement.location.city,
        duration: parseInt(this.requirement.duration),
        budget: this.requirement.budget.hourly,
        description: this.requirement.description
      });
    }
  }

  get skills(): FormArray {
    return this.requirementForm.get('skills') as FormArray;
  }

  get experience(): FormGroup {
    return this.requirementForm.get('experience') as FormGroup;
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
    if (this.mode === 'close' && this.requirement) {
      // For close mode, just emit the requirement with cancelled status
      this.confirm.emit({ ...this.requirement, status: 'cancelled' });
      this.close.emit();
      return;
    }

    if (this.requirementForm.valid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.requirementForm.value;
      const filteredSkills = formValue.skills.filter((skill: string) => skill.trim() !== '');

      if (filteredSkills.length === 0) return;

      const requirementData = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        skills: filteredSkills,
        experience: {
          minYears: formValue.experience.minYears,
          level: formValue.experience.level
        },
        location: {
          city: formValue.location,
          state: '',
          country: 'USA',
          remote: true
        },
        duration: formValue.duration.toString(),
        budget: {
          hourly: formValue.budget,
          currency: 'USD'
        },
        clientId: user._id,
        clientName: user.businessInfo?.companyName || 'Unknown Company',
        status: 'open' as const,
        createdBy: user._id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + formValue.duration * 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (this.mode === 'edit' && this.requirement) {
        this.confirm.emit({ ...this.requirement, ...requirementData });
      } else if (this.mode === 'create') {
        this.appService.addRequirement(requirementData);
      }

      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}