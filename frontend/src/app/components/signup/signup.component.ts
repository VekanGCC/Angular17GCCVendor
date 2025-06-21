import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { VendorRegistrationService } from '../../services/vendor-registration.service';
import { ClientRegistrationService } from '../../services/client-registration.service';
import { VendorRegistration } from '../../models/vendor-registration.model';
import { ClientRegistration } from '../../models/client-registration.model';
import { firstValueFrom } from 'rxjs';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface OTPResponse extends ApiResponse {
  otp?: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  currentStep = 0;
  totalSteps = 5;
  isLoading = false;
  error = '';
  success = '';
  otpVerified = false;
  
  // User type selection
  userType: 'vendor' | 'client' | null = null;
  
  // Forms for each step - initialized with default values
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;
  step4Form!: FormGroup;
  step5Form!: FormGroup;

  // Options
  serviceOptions: any[] = [];

  // OTP related
  otpSent = false;
  otpTimer = 0;
  otpInterval: any;

  vendorRegistration: VendorRegistration | null = null;
  clientRegistration: ClientRegistration | null = null;

  // Demo accounts
  demoAccounts = {
    vendor: {
      email: 'demo.vendor@example.com',
      password: 'Demo@123',
      companyName: 'Demo Vendor Company',
      firstName: 'John',
      lastName: 'Doe',
      contactPerson: 'John Doe',
      numberOfResources: 10,
      mobileNumber: '9876543210',
      gstNumber: '22AAAAA0000A1Z5',
      serviceProvided: 'IT Services'
    },
    client: {
      email: 'demo.client@example.com',
      password: 'Demo@123',
      companyName: 'Demo Client Company',
      firstName: 'Jane',
      lastName: 'Smith',
      contactPerson: 'Jane Smith',
      numberOfResources: 5,
      mobileNumber: '9876543211',
      gstNumber: '22BBBBB0000B1Z5',
      serviceProvided: 'IT Services'
    }
  };

  // Demo OTP
  demoOTP = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private vendorRegistrationService: VendorRegistrationService,
    private clientRegistrationService: ClientRegistrationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Check for user type in query params
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'vendor' || params['type'] === 'client') {
        this.userType = params['type'];
        this.loadRegistrationData();
      }
    });

    // If no user type specified, start with selection
    if (!this.userType) {
      this.currentStep = 0; // User type selection step
    }

    // Subscribe to registration data changes
    this.vendorRegistrationService.registration$.subscribe(registration => {
      if (registration) {
        this.vendorRegistration = registration;
        this.currentStep = registration.currentStep;
        this.otpVerified = registration.otpVerified;
      }
    });

    this.clientRegistrationService.registration$.subscribe(registration => {
      if (registration) {
        this.clientRegistration = registration;
        this.currentStep = registration.currentStep;
        this.otpVerified = registration.otpVerified;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  private loadRegistrationData(): void {
    if (this.userType === 'vendor') {
      this.serviceOptions = this.vendorRegistrationService.getServiceOptions();
      this.vendorRegistrationService.registration$.subscribe(registration => {
        this.vendorRegistration = registration;
        if (registration) {
          this.currentStep = registration.currentStep;
          this.populateFormsFromVendorRegistration(registration);
        }
      });
    } else if (this.userType === 'client') {
      this.serviceOptions = this.clientRegistrationService.getServiceRequiredOptions();
      this.clientRegistrationService.registration$.subscribe(registration => {
        this.clientRegistration = registration;
        if (registration) {
          this.currentStep = registration.currentStep;
          this.populateFormsFromClientRegistration(registration);
        }
      });
    }
  }

  selectUserType(type: 'vendor' | 'client'): void {
    this.userType = type;
    this.currentStep = 1;
    
    // Initialize registration data
    if (type === 'vendor') {
      this.vendorRegistrationService.initializeRegistration().subscribe();
    } else {
      this.clientRegistrationService.initializeRegistration().subscribe();
    }
    
    // Update URL with user type
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: type },
      queryParamsHandling: 'merge'
    });
    
    // Load registration data
    this.loadRegistrationData();
  }

  private initializeForms(): void {
    // Step 1: Company Information
    this.step1Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      gstNumber: ['', Validators.required],
      serviceType: ['', Validators.required],
      numberOfResources: [1, [Validators.required, Validators.min(1)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    }, { validators: this.passwordMatchValidator });

    // Step 2: OTP Verification
    this.step2Form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    // Step 3: Address & Bank Details (conditional)
    this.step3Form = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      accountNumber: ['', Validators.required],
      accountType: ['', Validators.required],
      ifscCode: ['', Validators.required],
      bankName: ['', Validators.required],
      branchName: ['', Validators.required],
      bankCity: ['', Validators.required],
      paymentTerms: ['', Validators.required]
    });

    // Step 4: Compliance Information
    this.step4Form = this.fb.group({
      panNumber: ['', [Validators.required, Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      registeredUnderESI: [false],
      registeredUnderPF: [false],
      registeredUnderMSMED: [false],
      esiRegistrationNumber: [''],
      pfRegistrationNumber: [''],
      msmedRegistrationNumber: [''],
      compliesWithStatutoryRequirements: [false, Validators.requiredTrue],
      hasCloseRelativesInCompany: [false],
      hasAdequateSafetyStandards: [false, Validators.requiredTrue],
      hasOngoingLitigation: [false]
    });

    // Step 5: Additional Information
    this.step5Form = this.fb.group({
      additionalNotes: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });

    this.setupConditionalValidators();
  }

  private updateFormValidatorsForUserType(): void {
    if (this.userType === 'vendor') {
      // Add bank details validators for vendors
      this.step3Form.get('accountNumber')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{9,18}$/)]);
      this.step3Form.get('accountType')?.setValidators([Validators.required]);
      this.step3Form.get('ifscCode')?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]);
      this.step3Form.get('bankName')?.setValidators([Validators.required]);
      this.step3Form.get('branchName')?.setValidators([Validators.required]);
      this.step3Form.get('bankCity')?.setValidators([Validators.required]);
      this.step3Form.get('paymentTerms')?.setValidators([Validators.required]);
    } else {
      // Remove bank details validators for clients
      this.step3Form.get('accountNumber')?.clearValidators();
      this.step3Form.get('accountType')?.clearValidators();
      this.step3Form.get('ifscCode')?.clearValidators();
      this.step3Form.get('bankName')?.clearValidators();
      this.step3Form.get('branchName')?.clearValidators();
      this.step3Form.get('bankCity')?.clearValidators();
      this.step3Form.get('paymentTerms')?.clearValidators();
    }

    // Update validity
    Object.keys(this.step3Form.controls).forEach(key => {
      this.step3Form.get(key)?.updateValueAndValidity();
    });
  }

  private setupConditionalValidators(): void {
    // ESI Registration Number validator
    this.step4Form.get('registeredUnderESI')?.valueChanges.subscribe(value => {
      const esiNumberControl = this.step4Form.get('esiRegistrationNumber');
      if (value) {
        esiNumberControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{10}$/)]);
      } else {
        esiNumberControl?.clearValidators();
      }
      esiNumberControl?.updateValueAndValidity();
    });

    // PF Registration Number validator
    this.step4Form.get('registeredUnderPF')?.valueChanges.subscribe(value => {
      const pfNumberControl = this.step4Form.get('pfRegistrationNumber');
      if (value) {
        pfNumberControl?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{2}\/[A-Z]{3}\/[0-9]{7}\/[0-9]{3}\/[0-9]{7}$/)]);
      } else {
        pfNumberControl?.clearValidators();
      }
      pfNumberControl?.updateValueAndValidity();
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  private populateFormsFromVendorRegistration(registration: VendorRegistration): void {
    // Populate Step 1
    this.step1Form.patchValue({
      companyName: registration.companyName,
      firstName: registration.firstName,
      lastName: registration.lastName,
      contactPerson: registration.contactPerson,
      gstNumber: registration.gstNumber,
      serviceType: registration.serviceType,
      numberOfResources: registration.numberOfResources,
      phone: registration.phone,
      password: registration.password,
      confirmPassword: registration.confirmPassword
    });

    // Populate Step 3
    this.step3Form.patchValue({
      addressLine1: registration.address.addressLine1,
      addressLine2: registration.address.addressLine2,
      city: registration.address.city,
      state: registration.address.state,
      country: registration.address.country,
      pinCode: registration.address.pinCode,
      accountNumber: registration.bankDetails.accountNumber,
      accountType: registration.bankDetails.accountType,
      ifscCode: registration.bankDetails.ifscCode,
      bankName: registration.bankDetails.bankName,
      branchName: registration.bankDetails.branchName,
      bankCity: registration.bankDetails.bankCity,
      paymentTerms: registration.bankDetails.paymentTerms
    });

    // Populate Step 4
    this.step4Form.patchValue({
      panNumber: registration.panNumber,
      registeredUnderESI: registration.registeredUnderESI,
      esiRegistrationNumber: registration.esiRegistrationNumber,
      registeredUnderPF: registration.registeredUnderPF,
      pfRegistrationNumber: registration.pfRegistrationNumber,
      registeredUnderMSMED: registration.registeredUnderMSMED
    });

    // Populate Step 5
    this.step5Form.patchValue({
      compliesWithStatutoryRequirements: registration.compliesWithStatutoryRequirements,
      hasCloseRelativesInCompany: registration.hasCloseRelativesInCompany,
      hasAdequateSafetyStandards: registration.hasAdequateSafetyStandards,
      hasOngoingLitigation: registration.hasOngoingLitigation
    });

    this.updateFormValidatorsForUserType();
  }

  private populateFormsFromClientRegistration(registration: ClientRegistration): void {
    // Populate Step 1 (adjust field names for client)
    this.step1Form.patchValue({
      companyName: registration.companyName,
      firstName: registration.firstName,
      lastName: registration.lastName,
      contactPerson: registration.contactPerson,
      gstNumber: registration.gstNumber,
      serviceType: registration.serviceType,
      numberOfResources: registration.numberOfRequirements,
      phone: registration.phone,
      password: registration.password,
      confirmPassword: registration.confirmPassword
    });

    // Populate Step 3 (no bank details for clients)
    this.step3Form.patchValue({
      addressLine1: registration.address.addressLine1,
      addressLine2: registration.address.addressLine2,
      city: registration.address.city,
      state: registration.address.state,
      country: registration.address.country,
      pinCode: registration.address.pinCode
    });

    // Populate Step 4
    this.step4Form.patchValue({
      panNumber: registration.panNumber,
      registeredUnderESI: registration.registeredUnderESI,
      esiRegistrationNumber: registration.esiRegistrationNumber,
      registeredUnderPF: registration.registeredUnderPF,
      pfRegistrationNumber: registration.pfRegistrationNumber,
      registeredUnderMSMED: registration.registeredUnderMSMED
    });

    // Populate Step 5
    this.step5Form.patchValue({
      compliesWithStatutoryRequirements: registration.compliesWithStatutoryRequirements,
      hasCloseRelativesInCompany: registration.hasCloseRelativesInCompany,
      hasAdequateSafetyStandards: registration.hasAdequateSafetyStandards,
      hasOngoingLitigation: registration.hasOngoingLitigation
    });

    this.updateFormValidatorsForUserType();
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  async nextStep(): Promise<void> {
    if (this.currentStep < this.totalSteps) {
      // Save the current step data
      const stepData = this.getCurrentStepData();
      
      if (this.currentStep === 1) {
        // For step 1, save the data and send OTP
        try {
          const response = await firstValueFrom<ApiResponse>(this.isVendor ? 
            this.vendorRegistrationService.saveStep(this.currentStep, stepData) :
            this.clientRegistrationService.saveStep(this.currentStep, stepData)
          );
          
          if (response.success) {
            // Send OTP after successful step 1 save
            await this.sendOTP();
            this.currentStep++;
          } else {
            this.error = response.message || 'Failed to save step 1 data';
          }
        } catch (error: any) {
          this.error = error.error?.message || 'Failed to save step 1 data';
        }
      } else if (this.currentStep === 2) {
        // For step 2, verify OTP
        try {
          const email = this.step1Form.get('email')?.value;
          const otp = this.step2Form.get('otp')?.value;
          
          const response = await firstValueFrom<ApiResponse>(this.isVendor ?
            this.vendorRegistrationService.saveStep(2, { email, otp }) :
            this.clientRegistrationService.saveStep(2, { email, otp })
          );

          if (response.success) {
            this.otpVerified = true;
            this.success = 'OTP verified successfully';
            this.currentStep++;
          } else {
            this.error = response.message || 'Invalid OTP. Please try again.';
          }
        } catch (error: any) {
          this.error = error.error?.message || 'Failed to verify OTP';
        }
      } else if (this.currentStep === 5) {
        // For step 5, complete registration
        try {
          const email = this.step1Form.get('email')?.value;
          const step5Data = { email, ...this.step5Form.value };
          const response = await firstValueFrom<ApiResponse>(this.isVendor ?
            this.vendorRegistrationService.saveStep(5, step5Data) :
            this.clientRegistrationService.saveStep(5, step5Data)
          );
          if (response.success) {
            this.success = 'Registration complete!';
            // Optionally, redirect or show a completion message
          } else {
            this.error = response.message || 'Failed to complete registration';
          }
        } catch (error: any) {
          this.error = error.error?.message || 'Failed to complete registration';
        }
      } else {
        // For other steps, just save the data
        try {
          const response = await firstValueFrom<ApiResponse>(this.isVendor ? 
            this.vendorRegistrationService.saveStep(this.currentStep, stepData) :
            this.clientRegistrationService.saveStep(this.currentStep, stepData)
          );
          
          if (response.success) {
            this.currentStep++;
          } else {
            this.error = response.message || `Failed to save step ${this.currentStep} data`;
          }
        } catch (error: any) {
          this.error = error.error?.message || `Failed to save step ${this.currentStep} data`;
        }
      }
    }
  }

  async sendOTP(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = '';
      const email = this.step1Form.get('email')?.value;
      
      const response = await firstValueFrom<OTPResponse>(this.isVendor ? 
        this.vendorRegistrationService.sendOTP(email) :
        this.clientRegistrationService.sendOTP(email)
      );

      if (response.success) {
        this.otpSent = true;
        this.startOtpTimer();
        this.success = 'OTP sent successfully';
        if (response.otp) {
          this.demoOTP = response.otp;
          this.success += '. For demo, use: ' + this.demoOTP;
        }
      } else {
        this.error = response.message || 'Failed to send OTP';
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to send OTP. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private startOtpTimer(): void {
    this.otpTimer = 300; // 5 minutes
    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
        this.otpSent = false;
      }
    }, 1000);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern']) return this.getPatternError(fieldName);
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      companyName: 'Company Name',
      firstName: 'First Name',
      lastName: 'Last Name',
      contactPerson: 'Contact Person',
      gstNumber: 'GST Number',
      serviceType: 'Service Type',
      numberOfResources: this.userType === 'client' ? 'Number of Requirements' : 'Number of Resources',
      phone: 'Mobile Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      otp: 'OTP',
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      country: 'Country',
      pinCode: 'Pin Code',
      accountNumber: 'Bank Account Number',
      accountType: 'Account Type',
      ifscCode: 'IFSC Code',
      bankName: 'Bank Name',
      branchName: 'Branch Name',
      bankCity: 'Bank City',
      paymentTerms: 'Payment Terms',
      panNumber: 'PAN Number',
      esiRegistrationNumber: 'ESI Registration Number',
      pfRegistrationNumber: 'PF Registration Number'
    };
    return labels[fieldName] || fieldName;
  }

  private getPatternError(fieldName: string): string {
    const errors: { [key: string]: string } = {
      phone: 'Mobile number must be 10 digits',
      gstNumber: 'Please enter a valid GST number',
      pinCode: 'Pin code must be 6 digits',
      accountNumber: 'Bank account number must be 9-18 digits',
      ifscCode: 'Please enter a valid IFSC code',
      panNumber: 'Please enter a valid PAN number',
      otp: 'OTP must be 6 digits',
      esiRegistrationNumber: 'ESI number must be 10 digits',
      pfRegistrationNumber: 'Please enter a valid PF registration number'
    };
    return errors[fieldName] || 'Please enter a valid value';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // Helper methods for template
  get isVendor(): boolean {
    return this.userType === 'vendor';
  }

  get isClient(): boolean {
    return this.userType === 'client';
  }

  get userTypeTitle(): string {
    return this.userType === 'vendor' ? 'Vendor' : 'Client';
  }

  get resourceFieldLabel(): string {
    return this.userType === 'client' ? 'Number of Requirements' : 'Number of Resources';
  }

  get serviceFieldLabel(): string {
    return this.userType === 'client' ? 'Service Required' : 'Service Provided';
  }

  get resourceFieldPlaceholder(): string {
    return this.userType === 'client' ? 'Enter expected number of requirements' : 'Enter number of resources';
  }

  get serviceFieldPlaceholder(): string {
    return this.userType === 'client' ? 'Select required service' : 'Select provided service';
  }

  getAccountTypeOptions() {
    return [
      { value: 'savings', label: 'Savings Account' },
      { value: 'current', label: 'Current Account' },
      { value: 'business', label: 'Business Account' }
    ];
  }

  populateDemoAccount(type: 'vendor' | 'client'): void {
    const demoData = this.demoAccounts[type];
    this.userType = type;
    
    // Populate Step 1 form with demo data
    this.step1Form.patchValue({
      companyName: demoData.companyName,
      firstName: demoData.firstName,
      lastName: demoData.lastName,
      contactPerson: demoData.contactPerson,
      gstNumber: demoData.gstNumber,
      serviceType: demoData.serviceProvided,
      numberOfResources: demoData.numberOfResources,
      phone: demoData.mobileNumber,
      password: demoData.password,
      confirmPassword: demoData.password
    });
  }

  private getCurrentStepData(): any {
    switch (this.currentStep) {
      case 1:
        return {
          email: this.step1Form.get('email')?.value,
          password: this.step1Form.get('password')?.value,
          companyName: this.step1Form.get('companyName')?.value,
          contactPerson: this.step1Form.get('contactPerson')?.value,
          gstNumber: this.step1Form.get('gstNumber')?.value,
          serviceType: this.step1Form.get('serviceType')?.value,
          numberOfResources: this.step1Form.get('numberOfResources')?.value,
          firstName: this.step1Form.get('firstName')?.value,
          lastName: this.step1Form.get('lastName')?.value,
          phone: this.step1Form.get('phone')?.value
        };
      case 2:
        return {
          email: this.step1Form.get('email')?.value,
          otp: this.step2Form.get('otp')?.value
        };
      case 3:
        return {
          email: this.step1Form.get('email')?.value,
          address: {
            addressLine1: this.step3Form.get('addressLine1')?.value,
            addressLine2: this.step3Form.get('addressLine2')?.value,
            city: this.step3Form.get('city')?.value,
            state: this.step3Form.get('state')?.value,
            country: this.step3Form.get('country')?.value,
            pinCode: this.step3Form.get('pinCode')?.value
          }
        };
      case 4:
        return {
          email: this.step1Form.get('email')?.value,
          panNumber: this.step4Form.get('panNumber')?.value,
          registeredUnderESI: this.step4Form.get('registeredUnderESI')?.value,
          registeredUnderPF: this.step4Form.get('registeredUnderPF')?.value,
          registeredUnderMSMED: this.step4Form.get('registeredUnderMSMED')?.value,
          esiRegistrationNumber: this.step4Form.get('esiRegistrationNumber')?.value,
          pfRegistrationNumber: this.step4Form.get('pfRegistrationNumber')?.value,
          msmedRegistrationNumber: this.step4Form.get('msmedRegistrationNumber')?.value,
          compliesWithStatutoryRequirements: this.step4Form.get('compliesWithStatutoryRequirements')?.value,
          hasCloseRelativesInCompany: this.step4Form.get('hasCloseRelativesInCompany')?.value,
          hasAdequateSafetyStandards: this.step4Form.get('hasAdequateSafetyStandards')?.value,
          hasOngoingLitigation: this.step4Form.get('hasOngoingLitigation')?.value
        };
      case 5:
        return {
          email: this.step1Form.get('email')?.value,
          additionalNotes: this.step5Form.get('additionalNotes')?.value,
          termsAccepted: this.step5Form.get('termsAccepted')?.value
        };
      default:
        return {};
    }
  }
}