import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationParams, PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/clients`;

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

  // Get client profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Update client profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  // Get client requirements with pagination
  getRequirements(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/requirements`, options);
  }

  // Create new requirement
  createRequirement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/requirements`, data);
  }

  // Update requirement
  updateRequirement(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/requirements/${id}`, data);
  }

  // Delete requirement
  deleteRequirement(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/requirements/${id}`);
  }

  // Get client applications with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/client`, options);
  }

  // Create application (client applying resource to requirement)
  createApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications`, data);
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const payload: any = { status };
    if (notes) {
      payload.notes = notes;
    }
    return this.http.put(`${environment.apiUrl}/applications/${applicationId}/status`, payload);
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/applications/${applicationId}/history`);
  }

  // Get client analytics
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }
} 