# Verifiable Credentials Implementation

## Overview
This implementation enables the creation and issuance of blockchain-verified degree certificates with verifiable credentials.

## System Architecture

### 1. Certificate Data Model
Certificates now include the following fields:
- **prn**: Unique student ID (Primary Key)
- **sno**: Auto-generated certificate serial number (Format: INST-YYYY-XXXXXX)
- **studentName**: Full name of the student
- **studentEmail**: Email address of the student
- **marks**: JSON array containing subject-wise marks `[{subject: string, marks: number}]`
- **issuerId**: Institute ID issuing the certificate
- **issuerName**: Name of the issuing institute
- **courseName**: Course/Major name
- **degree**: Degree type (e.g., Bachelor of Science, Master of Technology)
- **specialization**: Specialization/Major area
- **cgpa**: Cumulative GPA
- **division**: Division/Class (First Class, Second Class, etc.)
- **issueDate**: Date of certificate issuance
- **completionDate**: Course completion date
- **certificateUrl**: Cloudinary URL of the generated certificate PDF/image
- **offChainUrl**: IPFS or other off-chain storage URL
- **hash**: JWT token containing all certificate details
- **transactionHash**: Blockchain transaction hash

### 2. Smart Contract (DocStamp.sol)
The smart contract has been updated to:
- Map **PRN → Certificate Hash (JWT token)**
- Store certificates using `mapping(string => string)` instead of bytes32
- Provide methods to:
  - `issueCertificate(prn, certificateHash)`: Issue a new certificate
  - `getCertificateByPRN(prn)`: Retrieve certificate hash by PRN
  - `verifyCertificate(prn, certificateHash)`: Verify a certificate
  - `revokeCertificate(prn)`: Revoke a certificate (admin only)

### 3. Certificate Hash (JWT Token)
The certificate hash is a JWT token that contains:
- All certificate details (prn, sno, student info, marks, issuer info, etc.)
- Certificate URL (Cloudinary)
- Off-chain URL
- Timestamp of issuance
- Digital signature using HS256 algorithm

**Benefits:**
- Self-contained verification (all data in the token)
- Cryptographically signed (prevents tampering)
- Can be verified offline by decoding the JWT
- Blockchain serves as immutable proof of issuance

### 4. Certificate Issuance Flow

```
1. Admin fills the form with student details and marks
   ↓
2. System generates certificate PDF/image
   ↓
3. Certificate uploaded to Cloudinary
   ↓
4. Certificate data sent to /api/certificate/create
   ↓
5. API generates:
   - Auto-generated SNO (certificate serial number)
   - JWT token (certificate hash) containing all details + Cloudinary URL
   ↓
6. Certificate saved to database with all details
   ↓
7. Smart contract called: issueCertificate(PRN, JWT_hash)
   ↓
8. Blockchain mapping created: PRN → JWT_hash
   ↓
9. Transaction hash saved to database
   ↓
10. Certificate issued successfully!
```

### 5. API Endpoints

#### POST /api/certificate/create
Create a new certificate with all details.

**Request:**
```json
{
  "prn": "PRN2025001234",
  "studentName": "John Doe",
  "studentEmail": "john@example.com",
  "marks": [
    {"subject": "Data Structures", "marks": 85},
    {"subject": "Algorithms", "marks": 92},
    {"subject": "Database Systems", "marks": 88}
  ],
  "courseName": "Computer Science",
  "degree": "Bachelor of Technology",
  "specialization": "Artificial Intelligence",
  "cgpa": 8.5,
  "division": "First Class with Distinction",
  "issueDate": "2025-12-14T00:00:00Z",
  "completionDate": "2025-06-30T00:00:00Z",
  "certificateUrl": "https://res.cloudinary.com/...",
  "offChainUrl": "ipfs://..."
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "id": "...",
    "prn": "PRN2025001234",
    "sno": "INS-2025-123456",
    "certificateHash": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "certificateUrl": "https://res.cloudinary.com/...",
    "studentName": "John Doe",
    "issuerName": "ABC University"
  },
  "message": "Certificate created successfully. Ready to be issued on blockchain."
}
```

#### GET /api/certificate/create?prn=PRN2025001234
Retrieve certificate by PRN.

#### PATCH /api/certificate/create
Update certificate with blockchain transaction hash.

**Request:**
```json
{
  "prn": "PRN2025001234",
  "transactionHash": "0x..."
}
```

### 6. Utility Functions

**`generateCertificateHash(certificateData)`**
- Creates a JWT token containing all certificate details
- Signs the token with HS256 algorithm
- Expiration: 100 years (certificates are permanent)

**`verifyCertificateHash(certificateHash)`**
- Decodes and verifies the JWT token
- Returns certificate data if valid, null otherwise

**`generateCertificateSNO(instituteId)`**
- Generates unique certificate serial number
- Format: `INS-2025-123456`

## Security Features

1. **JWT Signature**: All certificate data is cryptographically signed
2. **Blockchain Immutability**: PRN-to-hash mapping cannot be altered once recorded
3. **Admin Authentication**: Only admins can issue certificates
4. **Email Verification**: Student must exist in database with matching email
5. **Unique PRN**: Prevents duplicate certificate issuance
6. **Revocation Support**: Admin can revoke certificates if needed

## Next Steps (To Be Implemented)

1. **Certificate PDF Generation**: Implement automatic PDF generation with all details
2. **Cloudinary Integration**: Auto-upload generated certificates
3. **Email Notification**: Send certificate to student's email
4. **QR Code**: Add QR code to certificate for quick verification
5. **Verification Portal**: Public page to verify certificates by PRN or QR scan
6. **Bulk Upload**: CSV/Excel import for batch certificate creation

## Environment Variables Required

```env
DATABASE_URL="mongodb://..."
JWT_SECRET="your-secret-key"
CERTIFICATE_JWT_SECRET="your-certificate-secret-key" # Optional, falls back to JWT_SECRET
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."
```

## Contract Deployment

After updating the smart contract, you need to:

1. Compile the contract:
```bash
cd backend
npx truffle compile
```

2. Deploy to blockchain:
```bash
npx truffle migrate --reset --network <your-network>
```

3. Update the contract ABI in `client/src/contract/DocStamp.json`

## Database Migration

Run Prisma migration to update the database schema:

```bash
cd client
npx prisma generate
npx prisma db push
```
