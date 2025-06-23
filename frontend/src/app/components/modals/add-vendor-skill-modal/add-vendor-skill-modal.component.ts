import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-vendor-skill-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-vendor-skill-modal.component.html',
  styleUrls: ['./add-vendor-skill-modal.component.css']
})
export class AddVendorSkillModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() skillAdded = new EventEmitter<any>();

  skillForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  loadingSkills = false;
  submitting = false;
  private subscription = new Subscription();

  proficiencyLevels = [
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.skillForm = this.fb.group({
      skillName: ['', Validators.required],
      description: ['', Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      proficiencyLevel: ['advanced', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAvailableSkills();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadAvailableSkills(): void {
    this.loadingSkills = true;
    this.subscription.add(
      this.apiService.getActiveSkills().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availableSkills = response.data;
            console.log('🔧 AddVendorSkillModal: Loaded available skills:', this.availableSkills);
          }
          this.loadingSkills = false;
        },
        error: (error) => {
          console.error('Error loading skills:', error);
          this.loadingSkills = false;
        }
      })
    );
  }

  onSkillSelect(event: any): void {
    const selectedSkill = this.availableSkills.find(skill => skill.name === event.target.value);
    if (selectedSkill) {
      this.skillForm.patchValue({
        skillName: selectedSkill.name
      });
    }
  }

  onSubmit(): void {
    if (this.skillForm.valid) {
      this.submitting = true;
      const skillData = { ...this.skillForm.value };
      // Map proficiencyLevel to proficiency for backend compatibility
      skillData.proficiency = skillData.proficiencyLevel;
      delete skillData.proficiencyLevel;
      
      this.subscription.add(
        this.apiService.createVendorSkill(skillData).subscribe({
          next: (response: any) => {
            if (response.success) {
              console.log('🔧 AddVendorSkillModal: Skill created successfully:', response.data);
              this.skillAdded.emit(response.data);
              this.closeModal.emit();
              this.skillForm.reset({ proficiencyLevel: 'advanced' });
            } else {
              console.error('Error creating skill:', response.message);
            }
            this.submitting = false;
          },
          error: (error: any) => {
            console.error('Error creating skill:', error);
            this.submitting = false;
          }
        })
      );
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.skillForm.controls).forEach(key => {
      const control = this.skillForm.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.closeModal.emit();
    this.skillForm.reset({ proficiencyLevel: 'advanced' });
  }

  getErrorMessage(controlName: string): string {
    const control = this.skillForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
      }
      if (control.errors['min']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at most ${control.errors['max'].max}`;
      }
    }
    return '';
  }
} 