# File Management System

This document describes the comprehensive file management functionality that has been added to the application.

## Overview

The file management system provides a complete solution for uploading, storing, organizing, and managing files within the application. It includes features for file upload, download, approval workflows, categorization, and bulk operations.

## Features

### Core Features
- **File Upload**: Drag-and-drop or click-to-upload functionality
- **File Download**: Secure file downloads with proper permissions
- **File Organization**: Categorization and tagging system
- **Approval Workflow**: Admin approval system for uploaded files
- **Bulk Operations**: Select and perform actions on multiple files
- **File Preview**: Image previews and file type icons
- **Search & Filter**: Advanced filtering by category, status, and more
- **Pagination**: Efficient handling of large file collections

### Security Features
- **Permission-based Access**: Users can only access their own files or public files
- **File Type Validation**: Restricted file types for security
- **File Size Limits**: Configurable maximum file sizes
- **Admin Controls**: Admin-only approval and management features

## Backend Components

### Models

#### File Model (`backend/models/File.js`)
```javascript
{
  filename: String,           // Generated filename
  originalName: String,       // Original filename
  path: String,              // File path on server
  mimetype: String,          // MIME type
  size: Number,              // File size in bytes
  extension: String,         // File extension
  uploadedBy: ObjectId,      // Reference to User
  entityType: String,        // 'user', 'resource', 'requirement', etc.
  entityId: ObjectId,        // Reference to entity
  category: String,          // 'profile', 'document', 'certificate', etc.
  description: String,       // File description
  isPublic: Boolean,         // Public visibility flag
  isApproved: Boolean,       // Approval status
  approvalStatus: String,    // 'pending', 'approved', 'rejected'
  approvalNotes: String,     // Admin notes
  approvedBy: ObjectId,      // Admin who approved/rejected
  approvedAt: Date,          // Approval timestamp
  downloadCount: Number,     // Download counter
  lastDownloadedAt: Date,    // Last download timestamp
  tags: [String],            // File tags
  metadata: Object,          // Additional metadata
  url: String                // Virtual field for file URL
}
```

### Controllers

#### File Controller (`backend/controllers/fileController.js`)
Provides comprehensive file management endpoints:

- `POST /api/files/upload` - Upload a new file
- `GET /api/files/entity/:entityType/:entityId` - Get files by entity
- `GET /api/files/my-files` - Get user's files
- `GET /api/files/:id` - Get specific file details
- `GET /api/files/:id/download` - Download file
- `PUT /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete file
- `PATCH /api/files/:id/approval` - Update approval status (admin)
- `GET /api/files/pending-approvals` - Get pending approvals (admin)
- `POST /api/files/bulk-approval` - Bulk approve/reject files (admin)

### Routes

#### File Routes (`backend/routes/files.js`)
All file routes are protected and require authentication. Admin routes require admin privileges.

### Middleware

#### Upload Middleware (`backend/middleware/upload.js`)
- **File Type Validation**: Supports JPEG, PNG, PDF, DOC, DOCX
- **File Size Limits**: Configurable (default 5MB)
- **Unique Filenames**: Prevents filename conflicts
- **Storage Configuration**: Organized file storage structure

## Frontend Components

### Models

#### File Interface (`frontend/src/app/models/file.model.ts`)
```typescript
interface File {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  extension: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  entityType: 'user' | 'resource' | 'requirement' | 'application' | 'vendor' | 'client';
  entityId: string;
  category: 'profile' | 'document' | 'certificate' | 'contract' | 'invoice' | 'other';
  description: string;
  isPublic: boolean;
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  tags: string[];
  metadata?: any;
  url: string;
  createdAt: string;
  updatedAt: string;
}
```

### Services

#### File Service (`frontend/src/app/services/file.service.ts`)
Provides a comprehensive service layer for file operations:

- **File Upload**: Handle file uploads with progress tracking
- **File Management**: CRUD operations for files
- **File Download**: Secure file downloads
- **Admin Operations**: Approval and bulk operations
- **Utility Methods**: File size formatting, icon mapping, type detection

#### API Service (`frontend/src/app/services/api.service.ts`)
Extended with file management endpoints for backend communication.

### Components

#### File Upload Component (`frontend/src/app/components/file-upload/`)
**Features:**
- Drag-and-drop file upload
- File type validation
- File size validation
- Progress tracking
- Image previews
- Multiple file support
- Error handling

**Usage:**
```html
<app-file-upload
  [entityType]="'user'"
  [entityId]="'user-id'"
  [category]="'document'"
  [description]="'User document'"
  [isPublic]="false"
  [maxFileSize]="5242880"
  [allowedTypes]="['image/*', 'application/pdf']"
  [multiple]="true"
  [showPreview]="true"
  (fileUploaded)="onFileUploaded($event)"
  (uploadError)="onUploadError($event)">
</app-file-upload>
```

#### File Management Component (`frontend/src/app/components/file-management/`)
**Features:**
- File listing with pagination
- Advanced filtering
- Bulk operations
- File actions (download, delete, approve)
- Admin approval workflow
- Responsive design

**Usage:**
```html
<app-file-management
  [entityType]="'user'"
  [entityId]="'user-id'"
  [isAdmin]="true"
  [showUpload]="true"
  [showFilters]="true"
  [showActions]="true">
</app-file-management>
```

## Usage Examples

### Basic File Upload
```typescript
// In your component
constructor(private fileService: FileService) {}

uploadFile(file: File, entityType: string, entityId: string) {
  const metadata = {
    category: 'document',
    description: 'Important document',
    isPublic: false,
    tags: 'important,urgent'
  };

  this.fileService.uploadFile(file, entityType, entityId, metadata)
    .subscribe({
      next: (response) => {
        console.log('File uploaded:', response.data);
      },
      error: (error) => {
        console.error('Upload failed:', error);
      }
    });
}
```

### File Management
```typescript
// Load files for an entity
loadFiles(entityType: string, entityId: string) {
  const filters = {
    category: 'document',
    approvalStatus: 'approved',
    page: 1,
    limit: 10
  };

  this.fileService.getFilesByEntity(entityType, entityId, filters)
    .subscribe({
      next: (response) => {
        this.files = response.data;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Failed to load files:', error);
      }
    });
}
```

### Admin Approval
```typescript
// Approve a file
approveFile(fileId: string) {
  const approval = {
    approvalStatus: 'approved' as const,
    approvalNotes: 'File looks good'
  };

  this.fileService.approveFile(fileId, approval)
    .subscribe({
      next: (response) => {
        console.log('File approved:', response.data);
      },
      error: (error) => {
        console.error('Approval failed:', error);
      }
    });
}
```

## Configuration

### Environment Variables
```env
# File upload settings
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=./uploads   # Upload directory
```

### File Type Configuration
Supported file types can be configured in `backend/middleware/upload.js`:
```javascript
const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
```

### File Size Limits
Default file size limit is 5MB, configurable via environment variable `MAX_FILE_SIZE`.

## Security Considerations

1. **File Type Validation**: Only allowed file types can be uploaded
2. **File Size Limits**: Prevents large file uploads
3. **Permission Checks**: Users can only access authorized files
4. **Admin Controls**: Sensitive operations require admin privileges
5. **Secure File Storage**: Files stored outside web root
6. **Unique Filenames**: Prevents filename conflicts and security issues

## File Categories

The system supports the following file categories:
- **Profile**: User profile images and documents
- **Document**: General documents
- **Certificate**: Certifications and qualifications
- **Contract**: Legal documents and contracts
- **Invoice**: Financial documents
- **Other**: Miscellaneous files

## Approval Workflow

1. **Upload**: User uploads file (status: pending)
2. **Review**: Admin reviews uploaded file
3. **Approval**: Admin approves or rejects file
4. **Notification**: User notified of approval status
5. **Access**: Approved files become accessible

## Demo

A demo page is available at `/files` route that showcases all file management features. The demo includes:
- File upload with drag-and-drop
- File listing and management
- Filtering and search
- Bulk operations
- Admin approval workflow

## Integration

The file management system can be integrated into any part of the application by:

1. **Adding the components** to your templates
2. **Injecting the FileService** into your components
3. **Using the file models** for type safety
4. **Configuring entity types** for your specific use case

## Future Enhancements

Potential improvements for the file management system:
- **Cloud Storage**: Integration with AWS S3, Google Cloud Storage
- **File Versioning**: Track file versions and changes
- **Advanced Search**: Full-text search within documents
- **File Encryption**: Encrypt sensitive files
- **CDN Integration**: Serve files via CDN for better performance
- **File Compression**: Automatic image and document compression
- **OCR Support**: Extract text from images and PDFs
- **File Sharing**: Generate shareable links for files 