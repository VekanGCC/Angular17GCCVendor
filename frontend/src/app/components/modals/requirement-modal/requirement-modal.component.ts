import { Component, EventEmitter, Output, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
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
export class RequirementModalComponent implements OnInit, OnChanges {
  @Input() requirement: Requirement | null = null;
  @Input() mode: 'create' | 'edit' | 'close' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<Requirement>();

  requirementForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  
  // File upload properties
  selectedFile: File | null = null;
  fileError: string | null = null;
  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly allowedFileTypes = ['.pdf', '.doc', '.docx'];
  
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
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef
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
    console.log('🔧 RequirementModal: ngOnInit called, mode:', this.mode, 'requirement:', this.requirement);
    console.log('🔧 RequirementModal: Initial form state:', this.requirementForm.value);
    console.log('🔧 RequirementModal: Initial budget value:', this.requirementForm.get('budget')?.value);
    
    // Load available skills from API first
    this.apiService.get<ApiResponse<AdminSkill[]>>('/skills/active').subscribe({
      next: (response) => {
        console.log('🔧 RequirementModal: Skills API response:', response);
        if (response.success && response.data) {
          this.availableSkills = response.data;
          console.log('🔧 RequirementModal: Available skills loaded:', this.availableSkills.length);
          
          // After skills are loaded, populate the form if in edit mode
          if (this.mode === 'edit' && this.requirement) {
            console.log('🔧 RequirementModal: Populating form after skills load');
            this.populateForm();
          }
        } else {
          console.error('🔧 RequirementModal: Failed to load skills:', response);
        }
      },
      error: (error) => {
        console.error('🔧 RequirementModal: Error loading skills:', error);
      }
    });

    // If not in edit mode, we don't need to wait for skills to load
    if (this.mode !== 'edit') {
      // If in edit mode, populate the form after skills are loaded (handled above)
      // If in create mode, form is already initialized with defaults
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle when requirement input changes (e.g., when modal opens with new requirement)
    if (changes['requirement'] && changes['requirement'].currentValue && this.mode === 'edit') {
      // If skills are already loaded, populate form immediately
      if (this.availableSkills.length > 0) {
        this.populateForm();
      }
      // If skills are not loaded yet, populateForm will be called after skills load in ngOnInit
    }
  }

  private populateForm(): void {
    if (!this.requirement) {
      console.log('🔧 RequirementModal: populateForm called but no requirement provided');
      return;
    }

    console.log('🔧 RequirementModal: Populating form with requirement:', this.requirement);
    console.log('🔧 RequirementModal: Requirement skills:', this.requirement.skills);

    // Clear existing skills FormArray and add the requirement's skills
    while (this.skills.length !== 0) {
      this.skills.removeAt(0);
    }
    
    // Add each skill from the requirement
    this.requirement.skills.forEach(skill => {
      console.log('🔧 RequirementModal: Adding skill to form:', skill);
      this.skills.push(this.fb.control(skill, Validators.required));
    });

    // If no skills, add at least one empty skill field
    if (this.skills.length === 0) {
      console.log('🔧 RequirementModal: No skills found, adding empty skill field');
      this.skills.push(this.fb.control('', Validators.required));
    }

    // Patch the rest of the form
    const formData = {
      title: this.requirement.title,
      category: this.requirement.category,
      experience: {
        minYears: this.requirement.experience.minYears,
        level: this.requirement.experience.level
      },
      location: this.requirement.location.city,
      duration: parseInt(this.requirement.duration),
      budget: this.requirement.budget.charge || 50, // Use charge value from new structure
      description: this.requirement.description
    };

    console.log('🔧 RequirementModal: Patching form with data:', formData);
    this.requirementForm.patchValue(formData);

    // Force change detection to update the form
    this.changeDetectorRef.detectChanges();
    console.log('🔧 RequirementModal: Form populated successfully');
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

    console.log('🔧 RequirementModal: onSubmit called, mode:', this.mode);
    this.logFormState();
    console.log('🔧 RequirementModal: Form errors:', this.requirementForm.errors);
    console.log('🔧 RequirementModal: Budget field errors:', this.requirementForm.get('budget')?.errors);

    if (this.requirementForm.valid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.requirementForm.value;
      console.log('🔧 RequirementModal: Form value:', formValue);
      console.log('🔧 RequirementModal: Budget in formValue:', formValue.budget);
      
      const filteredSkills = formValue.skills.filter((skill: string) => skill.trim() !== '');
      console.log('🔧 RequirementModal: Filtered skills:', filteredSkills);

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
        duration: formValue.duration,
        budget: {
          charge: formValue.budget,
          currency: 'USD',
          type: 'hourly'
        },
        clientId: user._id,
        clientName: user.businessInfo?.companyName || 'Unknown Company',
        status: 'open' as const,
        createdBy: user._id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + formValue.duration * 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      console.log('🔧 RequirementModal: Final requirement data being sent:', requirementData);
      console.log('🔧 RequirementModal: Budget data:', requirementData.budget);
      console.log('🔧 RequirementModal: Budget charge value:', requirementData.budget.charge);

      if (this.mode === 'edit' && this.requirement) {
        console.log('🔧 RequirementModal: Emitting edit confirmation');
        this.confirm.emit({ ...this.requirement, ...requirementData });
        this.close.emit();
      } else if (this.mode === 'create') {
        console.log('🔧 RequirementModal: Creating requirement with apiService.createRequirement');
        
        // Step 1: Create the requirement first
        this.apiService.createRequirement(requirementData).subscribe({
          next: (response: any) => {
            console.log('🔧 RequirementModal: Requirement created successfully:', response);
            
            if (response.success && response.data) {
              const requirementId = response.data._id;
              
              // Step 2: If file is selected, upload it with the requirement ID
              if (this.selectedFile) {
                console.log('🔧 RequirementModal: Uploading file for requirement:', requirementId);
                
                this.apiService.uploadFile(this.selectedFile, 'requirement', requirementId, {
                  category: 'document',
                  description: `Requirement document for: ${requirementData.title}`,
                  isPublic: false
                }).subscribe({
                  next: (fileResponse: any) => {
                    console.log('🔧 RequirementModal: File upload successful:', fileResponse);
                    
                    if (fileResponse.success && fileResponse.data) {
                      // Step 3: Update the requirement with file information
                      const updateData = {
                        attachment: {
                          fileId: fileResponse.data._id,
                          filename: fileResponse.data.filename,
                          path: fileResponse.data.path,
                          originalName: fileResponse.data.originalName,
                          fileSize: fileResponse.data.size,
                          fileType: fileResponse.data.mimetype
                        }
                      };
                      
                      console.log('🔧 RequirementModal: Updating requirement with file info:', updateData);
                      
                      this.apiService.updateRequirement(requirementId, updateData).subscribe({
                        next: (updateResponse: any) => {
                          console.log('🔧 RequirementModal: Requirement updated with file info:', updateResponse);
                          this.close.emit();
                          console.log('✅ Requirement created successfully with file attachment!');
                        },
                        error: (error: any) => {
                          console.error('🔧 RequirementModal: Error updating requirement with file info:', error);
                          console.error('❌ Requirement created but failed to attach file. Please try again.');
                        }
                      });
                    } else {
                      console.error('🔧 RequirementModal: File upload failed:', fileResponse);
                      console.error('❌ Requirement created but file upload failed. Please try again.');
                    }
                  },
                  error: (error: any) => {
                    console.error('🔧 RequirementModal: File upload error:', error);
                    console.error('❌ Requirement created but file upload failed. Please try again.');
                  }
                });
              } else {
                // No file selected, requirement creation is complete
                console.log('🔧 RequirementModal: Requirement created without file attachment');
                this.close.emit();
                console.log('✅ Requirement created successfully!');
              }
            } else {
              console.error('🔧 RequirementModal: Requirement creation failed:', response);
              console.error('❌ Failed to create requirement. Please try again.');
            }
          },
          error: (error: any) => {
            console.error('🔧 RequirementModal: Requirement creation error:', error);
            console.error('❌ Failed to create requirement. Please try again.');
          }
        });
      }
    } else {
      console.log('🔧 RequirementModal: Form is invalid:', this.requirementForm.errors);
      console.log('🔧 RequirementModal: Form status:', this.requirementForm.status);
      console.log('🔧 RequirementModal: All form controls:', this.requirementForm.controls);
      
      // Check each form control for errors
      Object.keys(this.requirementForm.controls).forEach(key => {
        const control = this.requirementForm.get(key);
        if (control && !control.valid) {
          console.log(`🔧 RequirementModal: ${key} is invalid:`, control.errors);
        }
      });
    }
  }

  onClose(): void {
    this.close.emit();
    // Force change detection to ensure modal closes immediately
    this.changeDetectorRef.detectChanges();
  }

  // File upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.fileError = null;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFileTypes.includes(fileExtension)) {
      this.fileError = 'Please select a PDF or DOC file only.';
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.fileError = 'File size must be less than 5MB.';
      return;
    }

    this.selectedFile = file;
    console.log('🔧 RequirementModal: File selected:', file.name, file.size);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileError = null;
    // Reset the file input
    const fileInput = document.getElementById('requirement-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Helper method to debug form state
  private logFormState(): void {
    console.log('🔧 RequirementModal: Current form state:', this.requirementForm.value);
    console.log('🔧 RequirementModal: Form valid:', this.requirementForm.valid);
    console.log('🔧 RequirementModal: Budget field value:', this.requirementForm.get('budget')?.value);
    console.log('🔧 RequirementModal: Budget field valid:', this.requirementForm.get('budget')?.valid);
  }
}