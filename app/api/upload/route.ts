import { NextRequest, NextResponse } from 'next/server';
import { uploadToAzureBlob } from '@/lib/azureBlob';
import { validateFileUpload, logSecurityEvent, createSafeErrorResponse } from '@/app/lib/security';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Check if Azure is configured
const isAzureConfigured = () => {
  return !!(process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER_NAME);
};

// Local storage upload function
async function uploadToLocalStorage(buffer: Buffer, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // Extract folder from filename if present
  const parts = filename.split('/');
  let targetDir = uploadDir;
  let targetFilename = filename;

  if (parts.length > 1) {
    targetDir = path.join(uploadDir, ...parts.slice(0, -1));
    targetFilename = parts[parts.length - 1];
  }

  // Create directory if it doesn't exist
  await mkdir(targetDir, { recursive: true });

  const filePath = path.join(targetDir, targetFilename);
  await writeFile(filePath, buffer);

  // Return public URL path
  const urlPath = `/uploads/${filename}`;
  return urlPath;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      logSecurityEvent('UPLOAD_NO_FILE', 'File upload attempted without file', ip);
      return createSafeErrorResponse(400, 'ไม่มีไฟล์สำหรับอัปโหลด');
    }

    // Validate file upload security
    const fileValidation = validateFileUpload(file.name, file.size);
    if (!fileValidation.valid) {
      logSecurityEvent('UPLOAD_INVALID_FILE', `Invalid file: ${fileValidation.error}`, ip);
      return createSafeErrorResponse(400, fileValidation.error || 'ไฟล์ไม่ถูกต้อง');
    }

    // Validate file type is image
    if (!file.type.startsWith('image/')) {
      logSecurityEvent('UPLOAD_INVALID_TYPE', `Non-image file type: ${file.type}`, ip);
      return createSafeErrorResponse(400, 'ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      logSecurityEvent('UPLOAD_FILE_TOO_LARGE', `File size ${file.size} exceeds max ${maxSize}`, ip);
      return createSafeErrorResponse(400, 'ขนาดไฟล์ต้องน้อยกว่า 5MB');
    }

    // Sanitize folder name - allow slashes for subfolders
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/');
    if (!sanitizedFolder) {
      logSecurityEvent('UPLOAD_INVALID_FOLDER', 'Invalid folder name', ip);
      return createSafeErrorResponse(400, 'ชื่อโฟลเดอร์ไม่ถูกต้อง');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      logSecurityEvent('UPLOAD_NO_EXTENSION', 'File without extension', ip);
      return createSafeErrorResponse(400, 'ไฟล์ต้องมีนามสกุล');
    }

    const filename = `${sanitizedFolder}/${timestamp}.${fileExt}`;

    let url: string;

    // Try Azure first, fallback to local storage
    if (isAzureConfigured()) {
      try {
        url = await uploadToAzureBlob(buffer, filename, file.type);
        console.log('📤 File uploaded to Azure:', filename);
      } catch (azureError) {
        console.error('Azure upload failed, falling back to local storage:', azureError);
        url = await uploadToLocalStorage(buffer, filename);
        console.log('📤 File uploaded to local storage (Azure failed):', filename);
      }
    } else {
      // Use local storage when Azure is not configured
      url = await uploadToLocalStorage(buffer, filename);
      console.log('📤 File uploaded to local storage (Azure not configured):', filename);
    }

    logSecurityEvent('UPLOAD_SUCCESS', `File uploaded: ${filename}`, ip);

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    logSecurityEvent('UPLOAD_EXCEPTION', 'Unexpected error during upload', ip);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'ไม่สามารถอัปโหลดไฟล์ได้',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

