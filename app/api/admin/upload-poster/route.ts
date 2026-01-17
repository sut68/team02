import { NextRequest, NextResponse } from 'next/server';
import { uploadToAzureBlob } from '@/lib/azureBlob';
import { validateFileUpload, logSecurityEvent, createSafeErrorResponse } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  // 1. ดึง IP เพื่อบันทึก Security Log
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // กำหนด Folder Default เป็น 'admin-posters' หากไม่ได้ส่งมา
    const folder = (formData.get('folder') as string) || 'admin-posters'; 

    if (!file) {
      logSecurityEvent('UPLOAD_NO_FILE', 'File upload attempted without file', ip);
      return createSafeErrorResponse(400, 'ไม่มีไฟล์สำหรับอัปโหลด');
    }

    // 2. Validate ความปลอดภัยของไฟล์ (ชื่อ, ขนาดเบื้องต้น)
    const fileValidation = validateFileUpload(file.name, file.size);
    if (!fileValidation.valid) {
      logSecurityEvent('UPLOAD_INVALID_FILE', `Invalid file: ${fileValidation.error}`, ip);
      return createSafeErrorResponse(400, fileValidation.error || 'ไฟล์ไม่ถูกต้อง');
    }

    // 3. ตรวจสอบชนิดไฟล์ (อนุญาตเฉพาะรูปภาพ)
    if (!file.type.startsWith('image/')) {
      logSecurityEvent('UPLOAD_INVALID_TYPE', `Non-image file type: ${file.type}`, ip);
      return createSafeErrorResponse(400, 'ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    }

    // 4. ตรวจสอบขนาดไฟล์ (Max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      logSecurityEvent('UPLOAD_FILE_TOO_LARGE', `File size ${file.size} exceeds max ${maxSize}`, ip);
      return createSafeErrorResponse(400, 'ขนาดไฟล์ต้องน้อยกว่า 5MB');
    }

    // 5. Sanitize ชื่อ Folder เพื่อความปลอดภัย
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/');
    if (!sanitizedFolder) {
      logSecurityEvent('UPLOAD_INVALID_FOLDER', 'Invalid folder name', ip);
      return createSafeErrorResponse(400, 'ชื่อโฟลเดอร์ไม่ถูกต้อง');
    }

    // 6. แปลงไฟล์เป็น Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 7. สร้างชื่อไฟล์ใหม่เพื่อไม่ให้ซ้ำ (Timestamp)
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      logSecurityEvent('UPLOAD_NO_EXTENSION', 'File without extension', ip);
      return createSafeErrorResponse(400, 'ไฟล์ต้องมีนามสกุล');
    }

    const filename = `${sanitizedFolder}/${timestamp}.${fileExt}`;

    // 8. อัปโหลดขึ้น Azure Blob Storage
    const url = await uploadToAzureBlob(buffer, filename, file.type);

    logSecurityEvent('UPLOAD_SUCCESS', `File uploaded to Azure: ${filename}`, ip);

    // ส่ง URL กลับไปให้ Frontend (โครงสร้างเดิมมี message, url)
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      url: url,
      filename: filename 
    }, { status: 200 });

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