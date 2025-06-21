import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { VendorManagementService } from '../../../services/vendor-management.service';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent {
  @Output() close = new EventEmitter<void>();

  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private vendorManagementService: VendorManagementService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      department: [''],
      phone: ['']
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.userForm.value;

      this.vendorManagementService.addVendorUser({
        ...formValue,
        vendorId: user._id,
        status: 'active' as const,
        createdBy: `${user.firstName} ${user.lastName}`
      });

      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}