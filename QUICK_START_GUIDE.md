# Quick Start Guide - Certificate System

## 🚀 Complete Implementation Checklist

### ✅ Already Implemented

1. **Database Schema** - Certificate model with all fields
2. **Smart Contract** - PRN → Certificate Hash mapping
3. **JWT Certificate Hash** - Cryptographic signing of all data
4. **Certificate PDF Generator** - Professional template with QR code
5. **Cloudinary Upload** - Automatic PDF upload and storage
6. **Admin Create Page** - Full certificate issuance flow
7. **Student Dashboard** - View all certificates with details
8. **API Endpoints** - Create, fetch, update certificates
9. **Clean UI** - 2-3 color palette, shadcn components only

## ⚙️ Setup Required (5 Minutes)

### 1. Cloudinary Setup
```
1. Go to https://cloudinary.com/ → Sign up (free)
2. Copy your "Cloud Name" from dashboard
3. Go to Settings → Upload → Upload presets
4. Click "Add upload preset"
5. Set "Signing Mode" to "Unsigned"
6. Save and copy the preset name
```

### 2. Add to .env.local
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name-here"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-preset-name-here"
```

### 3. Deploy Smart Contract
```bash
cd backend
npx truffle compile
npx truffle migrate --reset --network <your-network>
```

### 4. Update Contract ABI
```bash
# Copy the contract ABI
cp backend/build/contracts/DocStamp.json client/src/contract/DocStamp.json
```

### 5. Run Database Migration
```bash
cd client
npx prisma generate
npx prisma db push
```

## 🎯 How It Works

### Admin Issues Certificate:
1. Fill form at `/admin/create`
2. Click "Issue Certificate"
3. System automatically:
   - Generates professional PDF with QR code
   - Uploads to Cloudinary
   - Creates database record
   - Generates JWT hash
   - Records on blockchain
   - Saves transaction hash

### Student Views Certificate:
1. Login and go to `/student`
2. See all issued certificates
3. Click any certificate to view details
4. Download PDF anytime

### Anyone Verifies Certificate:
1. Scan QR code on certificate
2. Or visit verification URL
3. See all certificate details
4. Confirm blockchain verification

## 📁 Key Files

### Backend/Smart Contract
- `backend/contracts/DocStamp.sol` - Smart contract

### Frontend/Client
- `client/src/app/admin/create/page.tsx` - Issue certificates
- `client/src/app/student/page.tsx` - View certificates
- `client/src/lib/certificatePDF.ts` - PDF generation
- `client/src/lib/cloudinary.ts` - Cloud upload
- `client/src/lib/certificateHash.ts` - JWT signing
- `client/prisma/schema.prisma` - Database schema

### API Routes
- `/api/certificate/create` - Create certificate (POST, PATCH)
- `/api/certificate/user` - Get user's certificates (GET)
- `/api/certificate/all` - Get all certificates - admin (GET)

## 🎨 UI Design Principles

**Colors Used (2-3 only):**
- Primary (theme default) - Headers, buttons, accents
- Muted/Gray - Secondary text, borders
- Success green - Verified status badges

**Components (Shadcn only):**
- Card, Table, Badge, Dialog
- Button, Input, Select
- Separator, Tabs

**Clean & Professional:**
- Consistent spacing
- Clear hierarchy
- Minimal decorations
- Focus on content

## 🔍 Features Overview

### Certificate Contains:
- ✅ PRN (unique student ID)
- ✅ Serial number (auto-generated)
- ✅ Student details (name, email)
- ✅ Degree information
- ✅ Subject-wise marks
- ✅ CGPA and division
- ✅ Issue & completion dates
- ✅ QR code for verification
- ✅ Cloudinary URL (PDF)
- ✅ Blockchain transaction hash

### Admin Can:
- ✅ Issue new certificates
- ✅ View all issued certificates
- ✅ Search and filter certificates
- ✅ See statistics (total, verified, pending)
- ✅ Download certificate PDFs

### Student Can:
- ✅ View all their certificates
- ✅ See detailed certificate info
- ✅ Download certificate PDFs
- ✅ Check blockchain verification status

## 🧪 Test the System

```bash
# 1. Start the development server
cd client
npm run dev

# 2. Connect wallet (admin)
# 3. Go to http://localhost:3000/admin/create
# 4. Fill form with test data:
PRN: TEST001
Name: Test Student
Email: test@student.com
Degree: Bachelor of Technology
Course: Computer Science
Add some marks (Math: 85, Physics: 90)
CGPA: 8.5

# 5. Click "Issue Certificate"
# Watch it:
- Generate PDF
- Upload to Cloudinary
- Create DB record
- Issue on blockchain
- Save TX hash

# 6. Login as student (same email)
# 7. Go to http://localhost:3000/student
# 8. See your certificate!
```

## 📊 Database Structure

```
User
├── id
├── email
├── name
├── role (STUDENT/ADMIN)
└── certificates[] → Certificate

Certificate
├── id
├── prn (unique)
├── sno (unique serial number)
├── hash (JWT token)
├── studentName
├── studentEmail
├── marks (JSON array)
├── courseName
├── degree
├── specialization
├── cgpa
├── division
├── issuerId
├── issuerName
├── certificateUrl (Cloudinary)
├── transactionHash
└── owner → User
```

## 🔐 Security

- ✅ JWT signed with secret key
- ✅ Blockchain immutability
- ✅ Admin-only certificate creation
- ✅ HTTPS Cloudinary URLs
- ✅ Token-based authentication

## 💡 Pro Tips

1. **Testing**: Use Cloudinary's free tier for testing (generous limits)
2. **Production**: Set up signed uploads for better security
3. **Backup**: Cloudinary auto-backs up files
4. **QR Code**: Contains verification URL for easy scanning
5. **PDF Design**: Printer-friendly A4 landscape format

## 🎉 You're All Set!

The system is **production-ready** with:
- Professional PDF generation ✅
- Automatic cloud storage ✅
- Blockchain verification ✅
- Clean, modern UI ✅
- Complete certificate lifecycle ✅

Just add your Cloudinary credentials and start issuing certificates! 🚀
