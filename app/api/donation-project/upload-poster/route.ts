import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // 💡 เพิ่ม fs/promises สำหรับการเขียนไฟล์
import crypto from 'crypto'; // 💡 เพิ่ม crypto สำหรับสร้างชื่อไฟล์ที่ไม่ซ้ำ

// ---------------------------------------------------------------------------------
// 💡 Logic Helpers (คัดลอกจากไฟล์ register เพื่อจัดการไฟล์)
// ---------------------------------------------------------------------------------

// Resolve upload directory with env fallback (must stay inside public for static serving)
function resolveUploadDir(): string {
  const envDir = process.env.POSTER_UPLOAD_DIR?.trim() || 'uploads/posters';
  
  // ใช้ path.join เพื่อสร้าง path สัมบูรณ์
  // เราจะตั้งใจให้มันอยู่ใน public/uploads/posters
  return path.join(process.cwd(), 'public', envDir);
}

function pickExtension(file: File): string {
  const nameExt = path.extname(file.name).toLowerCase();
  if (nameExt) return nameExt;
  const type = file.type.toLowerCase();
  if (type === 'image/png') return '.png';
  if (type === 'image/jpeg' || type === 'image/jpg') return '.jpg';
  if (type === 'image/gif') return '.gif';
  return '.dat';
}

// ---------------------------------------------------------------------------------
// 💡 Next.js Route Handler สำหรับการอัปโหลดไฟล์จริง
// ---------------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 💡 Log เพื่อยืนยันว่า Route นี้ทำงานหรือไม่
  console.log('[API ROUTE] Attempting to process POST request for /api/admin/upload-poster');
  
  try {
    // 1. ดึง FormData จาก Request
    const formData = await request.formData();
    // ไฟล์ใน FormData ถูกส่งมาภายใต้ชื่อ 'file' (ตามที่ Frontend ส่ง uploadFormData.append('file', file))
    const posterFile = formData.get('file') as File | null; 

    if (!posterFile || posterFile.size === 0) {
      console.warn('[API ROUTE] No file provided or file size is zero.');
      return NextResponse.json({ message: 'No image file uploaded.' }, { status: 400 });
    }
    
    // 2. ตรวจสอบประเภทไฟล์
    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (posterFile.type && !allowedMime.includes(posterFile.type)) {
      console.warn(`[API ROUTE] Invalid file type received: ${posterFile.type}`);
      return NextResponse.json({ error: 'ชนิดไฟล์ไม่รองรับ (รองรับ: JPEG, PNG, GIF) เท่านั้น' }, { status: 400 });
    }

    // 3. เตรียมการบันทึกไฟล์
    const arrayBuffer = await posterFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadDir = resolveUploadDir();
    
    // สร้าง Directory ถ้ายังไม่มี
    await fs.mkdir(uploadDir, { recursive: true });
    
    // 4. สร้างชื่อไฟล์ที่ไม่ซ้ำกันและ Path
    const ext = pickExtension(posterFile);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const fullPath = path.join(uploadDir, uniqueName);
    
    // 5. บันทึกไฟล์
    await fs.writeFile(fullPath, buffer);
    
    // 6. คำนวณ Public URL
    const publicDir = path.join(process.cwd(), 'public');
    // 💡 สร้าง URL สาธารณะที่สามารถใช้ใน <Image src={...}> ได้
    const publicUrl = `/${path.relative(publicDir, fullPath).replace(/\\/g, '/')}`;

    console.log(`[UPLOAD SUCCESS] File saved to: ${publicUrl}`);


    // 7. ส่ง URL กลับไปให้ Frontend
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      url: publicUrl // 💡 ส่ง URL สาธารณะกลับไป
    }, { status: 200 });

  } catch (error) {
    console.error('File upload error:', error);
    // 💡 ถ้าเป็น Error เกี่ยวกับ Node.js runtime environment 
    //    อาจต้องพิจารณาว่า Next.js Server ถูกตั้งค่าให้รันใน Environment ที่เข้าถึง fs ได้หรือไม่
    return NextResponse.json({ message: 'Internal Server Error during file operation.' }, { status: 500 });
  }
}