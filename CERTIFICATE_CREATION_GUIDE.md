# Certificate Creation - Quick Start Guide

## What's Been Implemented

✅ **Database Schema (Prisma)** - Updated with all required fields
✅ **Smart Contract** - Modified to map PRN → Certificate Hash
✅ **JWT Certificate Hash** - Utility to generate/verify certificate tokens
✅ **API Endpoint** - `/api/certificate/create` for certificate issuance
✅ **Admin Form** - Updated with all degree certificate fields

## How Certificate Creation Works Now

### Admin Flow:
1. Navigate to `/admin/create`
2. Fill in the form:
   - **PRN** (Student ID) - e.g., PRN2025001234
   - **Student Name & Email**
   - **Degree Type** - Bachelor/Master/PhD
   - **Course/Major** - e.g., Computer Science
   - **Specialization** - e.g., AI/ML
   - **Marks** - Subject-wise marks (add multiple rows)
   - **CGPA & Division** - Overall performance
   - **Dates** - Issue date & Completion date
3. Click "Issue Certificate"

### Behind the Scenes:
1. Certificate PDF/image generated (placeholder URL for now)
2. Certificate details sent to API
3. API generates:
   - Unique SNO (Serial Number)
   - JWT token containing ALL certificate data + Cloudinary URL
4. Certificate saved to database
5. Smart contract called: `issueCertificate(PRN, JWT_hash)`
6. Blockchain records: `PRN → JWT_token` mapping
7. Transaction hash saved back to database

### Certificate Hash (JWT) Contains:
- PRN, SNO
- Student name, email
- All marks (subject-wise)
- Issuer ID & name
- Degree, course, specialization
- CGPA, division
- Issue & completion dates
- **Certificate URL** (Cloudinary)
- Off-chain URL
- Timestamp

## Next Steps for You to Implement

1. **Certificate PDF Generation**
   - Create a PDF template with all certificate fields
   - Use a library like `pdf-lib` or `puppeteer`
   - Include QR code for verification

2. **Cloudinary Integration**
   - Upload generated PDF to Cloudinary
   - Get the URL before calling the API
   - Pass the URL in `certificateUrl` field

3. **Verification Flow**
   - Student receives email with certificate
   - Anyone can scan QR code or enter PRN
   - System verifies: PRN → blockchain → JWT hash → decode → show details

## Important Files Modified

- [client/prisma/schema.prisma](client/prisma/schema.prisma) - Database schema
- [backend/contracts/DocStamp.sol](backend/contracts/DocStamp.sol) - Smart contract
- [client/src/lib/certificateHash.ts](client/src/lib/certificateHash.ts) - JWT utilities
- [client/src/app/api/certificate/create/route.ts](client/src/app/api/certificate/create/route.ts) - API endpoint
- [client/src/app/admin/create/page.tsx](client/src/app/admin/create/page.tsx) - Admin form

## To Deploy

1. **Database Migration:**
   ```bash
   cd client
   npx prisma generate
   npx prisma db push
   ```

2. **Smart Contract:**
   ```bash
   cd backend
   npx truffle compile
   npx truffle migrate --reset --network <your-network>
   ```

3. **Update Contract ABI:**
   - Copy `backend/build/contracts/DocStamp.json` 
   - To `client/src/contract/DocStamp.json`

## Testing Checklist

- [ ] Database schema updated
- [ ] Smart contract deployed
- [ ] Contract ABI updated in client
- [ ] Admin can create certificate
- [ ] Certificate saved to database
- [ ] Blockchain transaction successful
- [ ] JWT hash generated correctly
- [ ] Transaction hash saved to database

---

**Ready for the next part:** Student verification flow!
