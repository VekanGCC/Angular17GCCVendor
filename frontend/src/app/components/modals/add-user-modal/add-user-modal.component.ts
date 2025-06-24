import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { VendorService } from '../../../services/vendor.service';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent {
  @Input() userType: 'vendor' | 'client' = 'vendor';
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<any>();

  userForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private vendorService: VendorService,
    private clientService: ClientService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      group.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...employeeData } = this.userForm.value;

      // Use appropriate service based on userType
      if (this.userType === 'client') {
        this.clientService.addOrganizationUser(employeeData).subscribe({
          next: (response: any) => {
            this.loading = false;
            this.successMessage = response.message || 'Employee added successfully!';
            this.userAdded.emit(response.data);
            
            // Reset form
            this.userForm.reset();
            this.userForm.markAsUntouched();
            this.userForm.markAsPristine();
            
            // Close modal after 2 seconds
            setTimeout(() => {
              this.close.emit();
            }, 2000);
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error.error?.message || 'Error adding employee';
          }
        });
      } else {
        this.vendorService.addEmployee(employeeData).subscribe({
          next: (response: any) => {
            this.loading = false;
            this.successMessage = response.message || 'Employee added successfully!';
            this.userAdded.emit(response.data);
            
            // Reset form
            this.userForm.reset();
            this.userForm.markAsUntouched();
            this.userForm.markAsPristine();
            
            // Close modal after 2 seconds
            setTimeout(() => {
              this.close.emit();
            }, 2000);
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error.error?.message || 'Error adding employee';
          }
        });
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}