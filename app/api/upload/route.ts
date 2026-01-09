import { NextRequest, NextResponse } from 'next/server';
import { uploadToAzureBlob } from '@/lib/azureBlob';
import { validateFileUpload, logSecurityEvent, createSafeErrorResponse } from '@/app/lib/security';

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

    // Sanitize folder name
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
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

    // Upload to Azure Blob Storage
    const url = await uploadToAzureBlob(buffer, filename, file.type);

    logSecurityEvent('UPLOAD_SUCCESS', `File uploaded: ${filename}`, ip);

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    logSecurityEvent('UPLOAD_EXCEPTION', 'Unexpected error during upload', ip);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return createSafeErrorResponse(
      500,
      'ไม่สามารถอัปโหลดไฟล์ได้',
      process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
  }
}
