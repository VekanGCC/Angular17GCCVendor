import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatListModule],
  template: `
    <div class="sidebar">
      <div class="logo-section">
        <div class="logo">
          <mat-icon>business</mat-icon>
          <span>Enterprise Portal</span>
        </div>
      </div>
      
      <nav class="nav-menu">
        <div class="nav-group">
          <div class="nav-group-title">Overview</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
        </div>

        <div class="nav-group">
          <div class="nav-group-title">Workflow</div>
          <a routerLink="/sow" routerLinkActive="active" class="nav-item">
            <mat-icon>assignment</mat-icon>
            <span>Statement of Work</span>
            <div class="nav-badge">SOW</div>
          </a>
          <a routerLink="/po" routerLinkActive="active" class="nav-item">
            <mat-icon>shopping_cart</mat-icon>
            <span>Purchase Orders</span>
            <div class="nav-badge">PO</div>
          </a>
          <a routerLink="/invoice" routerLinkActive="active" class="nav-item">
            <mat-icon>receipt</mat-icon>
            <span>Invoices</span>
            <div class="nav-badge">INV</div>
          </a>
          <a routerLink="/payment" routerLinkActive="active" class="nav-item">
            <mat-icon>payment</mat-icon>
            <span>Payments</span>
            <div class="nav-badge">PAY</div>
          </a>
        </div>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .logo-section {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 500;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .nav-menu {
      flex: 1;
      padding: 20px 0;
    }

    .nav-group {
      margin-bottom: 24px;
    }

    .nav-group-title {
      padding: 0 20px 12px 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      opacity: 0.7;
      letter-spacing: 1px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
      
      &:hover {
        background-color: rgba(255,255,255,0.1);
        color: white;
      }
      
      &.active {
        background-color: rgba(255,255,255,0.15);
        color: white;
        border-right: 3px solid #fbbf24;
      }
      
      mat-icon {
        margin-right: 12px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      span {
        flex: 1;
        font-size: 14px;
      }
    }

    .nav-badge {
      background-color: rgba(255,255,255,0.2);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }
  `]
})
export class SidebarComponent {}