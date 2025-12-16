/**
 * Upload file to Cloudinary
 * This is a client-side upload using Cloudinary's upload preset
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'certificates'
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload to Cloudinary'
    );
  }
}

/**
 * Upload certificate PDF to Cloudinary
 */
export async function uploadCertificatePDF(
  pdfFile: File,
  _prn: string
): Promise<string> {
  try {
    const result = await uploadToCloudinary(pdfFile, `certificates/${new Date().getFullYear()}`);
    return result.url;
  } catch (error) {
    console.error('Error uploading certificate:', error);
    throw error;
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // Note: For security reasons, deletion should be done from the backend
  // This is just a placeholder for the API endpoint
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete from Cloudinary');
  }
}
