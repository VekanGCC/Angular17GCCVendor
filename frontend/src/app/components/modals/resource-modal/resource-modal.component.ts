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
  isSubmitting = false;
  
  // File upload properties
  selectedFile: File | null = null;
  fileError: string | null = null;
  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly allowedFileTypes = ['.pdf', '.doc', '.docx'];

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
      this.isSubmitting = true;
      const formValue = this.resourceForm.value;
      
      // Prepare resource data without attachment
      const resourceData = {
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        skills: formValue.skills || [],
        experience: {
          years: formValue.experience.years,
          level: formValue.experience.level
        },
        location: {
          city: formValue.location.city,
          state: formValue.location.state,
          country: formValue.location.country,
          remote: formValue.location.remote
        },
        availability: {
          status: formValue.availability.status,
          hours_per_week: formValue.availability.hours_per_week,
          start_date: formValue.availability.start_date
        },
        rate: {
          hourly: formValue.rate.hourly,
          currency: formValue.rate.currency
        },
        status: 'active',
        vendorName: 'Unknown Company'
      };

      console.log('🔧 ResourceModal: Creating resource with data:', resourceData);

      // Step 1: Create the resource first
      this.apiService.createResource(resourceData).subscribe({
        next: (response) => {
          console.log('🔧 ResourceModal: Resource created successfully:', response);
          
          if (response.success && response.data) {
            const resourceId = response.data._id;
            
            // Step 2: If file is selected, upload it with the resource ID
            if (this.selectedFile) {
              console.log('🔧 ResourceModal: Uploading file for resource:', resourceId);
              
              this.apiService.uploadFile(this.selectedFile, 'resource', resourceId, {
                category: 'document',
                description: `Resource document for: ${resourceData.name}`,
                isPublic: false
              }).subscribe({
                next: (fileResponse) => {
                  console.log('🔧 ResourceModal: File upload successful:', fileResponse);
                  
                  if (fileResponse.success && fileResponse.data) {
                    // Step 3: Update the resource with file information
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
                    
                    console.log('🔧 ResourceModal: Updating resource with file info:', updateData);
                    
                    this.apiService.updateResource(resourceId, updateData).subscribe({
                      next: (updateResponse) => {
                        console.log('🔧 ResourceModal: Resource updated with file info:', updateResponse);
                        this.isSubmitting = false;
                        this.close.emit();
                        console.log('✅ Resource created successfully with file attachment!');
                      },
                      error: (error) => {
                        console.error('🔧 ResourceModal: Error updating resource with file info:', error);
                        this.isSubmitting = false;
                        console.error('❌ Resource created but failed to attach file. Please try again.');
                      }
                    });
                  } else {
                    console.error('🔧 ResourceModal: File upload failed:', fileResponse);
                    this.isSubmitting = false;
                    console.error('❌ Resource created but file upload failed. Please try again.');
                  }
                },
                error: (error) => {
                  console.error('🔧 ResourceModal: File upload error:', error);
                  this.isSubmitting = false;
                  console.error('❌ Resource created but file upload failed. Please try again.');
                }
              });
            } else {
              // No file selected, resource creation is complete
              console.log('🔧 ResourceModal: Resource created without file attachment');
              this.isSubmitting = false;
              this.close.emit();
              console.log('✅ Resource created successfully!');
            }
          } else {
            console.error('🔧 ResourceModal: Resource creation failed:', response);
            this.isSubmitting = false;
            console.error('❌ Failed to create resource. Please try again.');
          }
        },
        error: (error) => {
          console.error('🔧 ResourceModal: Resource creation error:', error);
          this.isSubmitting = false;
          console.error('❌ Failed to create resource. Please try again.');
        }
      });
    }
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
    console.log('🔧 ResourceModal: File selected:', file.name, file.size);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileError = null;
    // Reset the file input
    const fileInput = document.getElementById('resource-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onClose(): void {
    this.close.emit();
  }
}