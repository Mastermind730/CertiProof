# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `client` directory with the following variables:

### Database
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/certiproof?retryWrites=true&w=majority"
```

### JWT Secret
```env
JWT_SECRET="your-super-secret-jwt-key-here"
CERTIFICATE_JWT_SECRET="your-certificate-signing-secret-key" # Optional, falls back to JWT_SECRET
```

### Blockchain
```env
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..." # Your deployed DocStamp contract address
```

### Cloudinary Configuration
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

## Cloudinary Setup Instructions

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com/
   - Sign up for a free account

2. **Get Cloud Name**
   - After logging in, you'll see your "Cloud name" in the dashboard
   - Copy this to `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

3. **Create Upload Preset**
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Configuration:
     - Signing Mode: **Unsigned** (for client-side uploads)
     - Folder: `certificates` (optional, but recommended)
     - Upload preset name: e.g., `certiproof_certificates`
   - Save the preset
   - Copy the preset name to `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

4. **Recommended Settings for Upload Preset**
   ```
   Signing Mode: Unsigned
   Folder: certificates
   Format: pdf
   Resource type: auto
   Access mode: public
   Unique filename: true
   Overwrite: false
   ```

## Example .env.local File

```env
# Database
DATABASE_URL="mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/certiproof?retryWrites=true&w=majority"

# JWT
JWT_SECRET="my-super-secret-jwt-key-2025"
CERTIFICATE_JWT_SECRET="certificate-signing-secret-key-2025"

# Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="certiproof"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="certiproof_certificates"

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Security Notes

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Use strong, unique secrets** for JWT keys
3. **Rotate secrets periodically** in production
4. **Use unsigned upload presets** only for PDFs with proper validation
5. **Consider signed uploads** for production for better security

## Testing Cloudinary Upload

After setting up, you can test the upload:

```typescript
import { uploadCertificatePDF } from '@/lib/cloudinary';

// In your component
const testFile = new File([blob], 'test.pdf', { type: 'application/pdf' });
const url = await uploadCertificatePDF(testFile, 'TEST001');
console.log('Uploaded to:', url);
```
