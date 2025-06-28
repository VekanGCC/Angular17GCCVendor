import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  InvoiceApprovalRequest, 
  PaymentUpdateRequest, 
  CreditNoteRequest 
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoice`;

  constructor(private http: HttpClient) {}

  // Get all invoices with optional filters
  getInvoices(params?: {
    page?: number;
    limit?: number;
    paymentStatus?: string;
    vendorId?: string;
    clientId?: string;
    poId?: string;
  }): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  // Get single invoice by ID
  getInvoice(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Create new invoice
  createInvoice(invoiceData: CreateInvoiceRequest): Observable<any> {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('poId', invoiceData.poId);
    formData.append('vendorId', invoiceData.vendorId);
    formData.append('invoiceDate', invoiceData.invoiceDate);
    formData.append('invoiceAmount', JSON.stringify(invoiceData.invoiceAmount));
    formData.append('workSummary', invoiceData.workSummary);
    
    // Add file if provided
    if (invoiceData.invoiceFile) {
      formData.append('invoiceFile', invoiceData.invoiceFile);
    }

    return this.http.post(this.apiUrl, formData);
  }

  // Update invoice
  updateInvoice(id: string, invoiceData: UpdateInvoiceRequest): Observable<any> {
    const formData = new FormData();
    
    // Add fields if provided
    if (invoiceData.invoiceDate) {
      formData.append('invoiceDate', invoiceData.invoiceDate);
    }
    if (invoiceData.invoiceAmount) {
      formData.append('invoiceAmount', JSON.stringify(invoiceData.invoiceAmount));
    }
    if (invoiceData.workSummary) {
      formData.append('workSummary', invoiceData.workSummary);
    }
    if (invoiceData.invoiceFile) {
      formData.append('invoiceFile', invoiceData.invoiceFile);
    }

    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  // Approve/reject invoice
  approveInvoice(id: string, approvalData: InvoiceApprovalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, approvalData);
  }

  // Mark invoice as paid
  markAsPaid(id: string, paymentData: PaymentUpdateRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark-paid`, paymentData);
  }

  // Create credit note
  createCreditNote(id: string, creditNoteData: CreditNoteRequest): Observable<any> {
    const formData = new FormData();
    
    formData.append('amount', creditNoteData.amount.toString());
    formData.append('reason', creditNoteData.reason);
    
    if (creditNoteData.creditNoteFile) {
      formData.append('creditNoteFile', creditNoteData.creditNoteFile);
    }

    return this.http.post(`${this.apiUrl}/${id}/credit-note`, formData);
  }

  // Delete invoice
  deleteInvoice(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 