import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationParams, PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private apiUrl = `${environment.apiUrl}/vendors`;

  constructor(private http: HttpClient) {}

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
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Update vendor profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  // Get vendor resources with pagination
  getResources(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/resources`, options);
  }

  // Create new resource
  createResource(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/resources`, data);
  }

  // Update resource
  updateResource(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, data);
  }

  // Update resource status
  updateResourceStatus(id: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, { status });
  }

  // Delete resource
  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/resources/${id}`);
  }

  // Get vendor applications with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/vendor`, options);
  }

  // Create application (vendor applying resource to requirement)
  createApplication(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/applications`, data);
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const payload: any = { status };
    if (notes) {
      payload.notes = notes;
    }
    return this.http.put(`${this.apiUrl}/applications/${applicationId}/status`, payload);
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/applications/${applicationId}/history`);
  }

  // Get vendor analytics
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  // Get vendor skills
  getSkills(): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills`);
  }

  // Add vendor skill
  addSkill(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/skills`, data);
  }

  // Remove vendor skill
  removeSkill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/skills/${id}`);
  }
} 