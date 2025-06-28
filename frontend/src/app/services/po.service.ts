import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PO, CreatePORequest, UpdatePORequest, POResponse, FinanceApprovalRequest } from '../models/po.model';

@Injectable({
  providedIn: 'root'
})
export class POService {
  private apiUrl = `${environment.apiUrl}/po`;

  constructor(private http: HttpClient) {}

  // Get all POs with optional filters
  getPOs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
    clientId?: string;
    sowId?: string;
  }): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  // Get single PO by ID
  getPO(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Create new PO
  createPO(poData: CreatePORequest): Observable<any> {
    return this.http.post(this.apiUrl, poData);
  }

  // Update PO
  updatePO(id: string, poData: UpdatePORequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, poData);
  }

  // Submit PO for finance approval
  submitPO(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/submit`, {});
  }

  // Finance approval for PO
  financeApproval(id: string, approvalData: FinanceApprovalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/finance-approval`, approvalData);
  }

  // Send PO to vendor
  sendToVendor(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/send-to-vendor`, {});
  }

  // Vendor response to PO
  vendorResponse(id: string, response: POResponse): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/vendor-response`, response);
  }

  // Activate PO
  activatePO(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/activate`, {});
  }

  // Delete PO
  deletePO(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 