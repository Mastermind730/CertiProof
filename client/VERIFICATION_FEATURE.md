# Certificate Verification with PDF Upload and Email Approval

## Overview
This feature allows users to upload a PDF certificate and automatically request approval from the certificate owner before verification proceeds.

## How It Works

### 1. PDF Upload & QR Code Extraction
- User uploads a PDF certificate containing a QR code
- The QR code contains certificate payload (PRN, email, issue date)
- Frontend extracts the QR code using `pdfjs-dist` and `jsqr` libraries

### 2. Email Approval Request
- System extracts the email address from the QR code payload
- An approval request email is sent to the certificate owner
- Email contains "Approve" and "Reject" links

### 3. Approval Flow
- Frontend polls the approval status every 3 seconds
- Certificate owner clicks the link in their email
- Status updates to "approved" or "rejected"

### 4. Certificate Verification
- Once approved, the system proceeds with blockchain verification
- Certificate details are displayed to the requester
- If rejected, an error message is shown

## API Endpoints

### POST `/api/verify/upload`
Handles PDF upload and creates an approval request.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `pdf`: File (PDF certificate)
  - `payload`: JSON string (extracted from QR code)

**Response:**
```json
{
  "success": true,
  "requestId": "abc123...",
  "message": "Approval request sent to certificate owner"
}
```

### GET `/api/verify/approval?requestId=xxx`
Polls or handles approval status.

**For Polling (no action parameter):**
- Returns: `{ status: "pending" | "approved" | "rejected", certificateId: "...", payload: {...} }`

**For Approval (action=approve):**
- Sets status to "approved"
- Returns HTML success page

**For Rejection (action=reject):**
- Sets status to "rejected"
- Returns HTML rejection page

### POST `/api/verify`
Performs actual certificate verification on blockchain.

**Request:**
```json
{
  "certificateId": "CERT-2025-123456",
  "payload": { /* QR payload */ },
  "requestId": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "certificateId": "...",
    "studentName": "...",
    "courseName": "...",
    // ... other details
  }
}
```

## Environment Variables

Create a `.env.local` file in the `client` folder:

```env
# Email Configuration (for sending approval requests)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Setting up Gmail App Password:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASS`

## Testing

1. Create a certificate using `/test_create` page (it embeds a QR code)
2. Download the generated PDF
3. Go to `/test_verify` page
4. Upload the PDF
5. Check the email inbox (from QR payload)
6. Click "Approve" or "Reject"
7. The verification page will automatically update

## Libraries Used

- **pdfjs-dist**: Client-side PDF parsing and rendering
- **jsqr**: QR code reading from canvas
- **nodemailer**: Email sending
- **jsPDF**: PDF generation (in create page)
- **qrcode**: QR code generation (in create page)

## Notes

- Approval requests are stored in-memory (use a database in production)
- Email is optional - configure environment variables to enable
- The system falls back to manual ID entry if PDF upload fails
- Canvas is required for QR extraction (works in browser only)

## Future Enhancements

- Add database for persistent approval storage
- Add expiration time for approval requests
- Support multiple QR code formats
- Add SMS notification option
- Implement rate limiting for approval requests
