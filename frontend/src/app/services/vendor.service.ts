import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationParams, PaginatedResponse } from '../models/pagination.model';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private apiUrl = `${environment.apiUrl}/vendors`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private buildHttpParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    
    return httpParams;
  }

  // Get vendor profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() });
  }

  // Update vendor profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data, { headers: this.getAuthHeaders() });
  }

  // Get vendor resources with pagination
  getResources(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = { 
      headers: this.getAuthHeaders(),
      params: params ? this.buildHttpParams(params) : undefined 
    };
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/resources`, options);
  }

  // Create new resource
  createResource(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/resources`, data, { headers: this.getAuthHeaders() });
  }

  // Update resource
  updateResource(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, data, { headers: this.getAuthHeaders() });
  }

  // Update resource status
  updateResourceStatus(id: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, { status }, { headers: this.getAuthHeaders() });
  }

  // Delete resource
  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/resources/${id}`, { headers: this.getAuthHeaders() });
  }

  // Get vendor applications with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = { 
      headers: this.getAuthHeaders(),
      params: params ? this.buildHttpParams(params) : undefined 
    };
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/vendor`, options);
  }

  // Create application (vendor applying resource to requirement)
  createApplication(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/applications`, data, { headers: this.getAuthHeaders() });
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const payload: any = { status };
    if (notes) {
      payload.notes = notes;
    }
    return this.http.put(`${environment.apiUrl}/applications/${applicationId}/status`, payload, { headers: this.getAuthHeaders() });
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/applications/${applicationId}/history`, { headers: this.getAuthHeaders() }).pipe(
      tap((response: any) => {
        console.log('🔧 VendorService: Application history response:', response);
      }),
      catchError(error => {
        console.error('🔧 VendorService: Error in getApplicationHistory:', error);
        throw error;
      })
    );
  }

  // Get vendor analytics
  getAnalytics(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/analytics`, { headers: this.getAuthHeaders() });
  }

  // Get vendor skills
  getSkills(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/niche-skills`, { headers: this.getAuthHeaders() });
  }

  // Add vendor skill
  addSkill(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/niche-skills`, data, { headers: this.getAuthHeaders() });
  }

  // Remove vendor skill
  removeSkill(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/vendor/niche-skills/${id}`, { headers: this.getAuthHeaders() });
  }

  // Add employee to organization
  addEmployee(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/add-employee`, data, { headers: this.getAuthHeaders() });
  }

  // Get organization employees
  getEmployees(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/organization/employees`, { headers: this.getAuthHeaders() });
  }

  // Verify employee OTP
  verifyEmployeeOTP(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/verify-otp`, data);
  }

  // Resend OTP
  resendOTP(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/resend-otp`, data, { headers: this.getAuthHeaders() });
  }
} 