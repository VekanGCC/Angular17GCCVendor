import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PO, CreatePORequest, UpdatePORequest, POResponse, FinanceApprovalRequest } from '../models/po.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class POService {
  private baseApiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getApiUrl(): string {
    const currentUser = this.authService.getCurrentUser();
    const userType = currentUser?.userType;
    
    let apiUrl: string;
    if (userType === 'vendor') {
      apiUrl = `${this.baseApiUrl}/vendor/po`;
    } else {
      apiUrl = `${this.baseApiUrl}/client/po`;
    }
    
    console.log('🔧 PO Service: Using API URL:', apiUrl, 'for user type:', userType);
    return apiUrl;
  }

  // Get all POs with optional filters
  getPOs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
    clientId?: string;
    sowId?: string;
  }): Observable<any> {
    const apiUrl = this.getApiUrl();
    console.log('🔧 PO Service: Fetching POs from:', apiUrl);
    console.log('🔧 PO Service: Parameters:', params);
    return this.http.get(apiUrl, { params });
  }

  // Get single PO by ID
  getPO(id: string): Observable<any> {
    return this.http.get(`${this.getApiUrl()}/${id}`);
  }

  // Create new PO
  createPO(poData: CreatePORequest): Observable<any> {
    return this.http.post(this.getApiUrl(), poData);
  }

  // Update PO
  updatePO(id: string, poData: UpdatePORequest): Observable<any> {
    return this.http.put(`${this.getApiUrl()}/${id}`, poData);
  }

  // Submit PO for finance approval
  submitPO(id: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/submit`, {});
  }

  // Finance approval for PO
  financeApproval(id: string, approvalData: FinanceApprovalRequest): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/finance-approval`, approvalData);
  }

  // Send PO to vendor
  sendToVendor(id: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/send-to-vendor`, {});
  }

  // Vendor response to PO
  vendorResponse(id: string, response: POResponse): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/vendor-response`, response);
  }

  // Activate PO
  activatePO(id: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/activate`, {});
  }

  // Delete PO
  deletePO(id: string): Observable<any> {
    return this.http.delete(`${this.getApiUrl()}/${id}`);
  }
} 