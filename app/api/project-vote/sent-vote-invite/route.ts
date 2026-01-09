import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { transporter, mailOptions } from "@/app/lib/nodemailer";

// กำหนดให้เรียกใช้ได้เฉพาะ Admin หรือ Cron Secret
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('roundId'); // รับ ID รอบงบประมาณที่จะแจ้งเตือน

    if (!roundId) return NextResponse.json({ error: "ระบุ Round ID" }, { status: 400 });
    const lastId = Number(searchParams.get('lastId')) || 0; // ถ้าไม่ใส่ เริ่มจาก 0
    const limit = 400;

    // 1. ดึงข้อมูลรอบงบประมาณ
    const round = await prisma.budgetRound.findUnique({
      where: { id: Number(roundId) },
    });

    if (!round || !round.endDate) {
        return NextResponse.json({ error: "ไม่พบข้อมูลรอบ" }, { status: 404 });
    }

    // 2. เช็คเวลา: ต้องอยู่ในช่วง 15 วันสุดท้ายเท่านั้น
    const now = new Date();
    const endDate = new Date(round.endDate);
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    
    // ถ้ายังไม่ถึง 15 วันสุดท้าย (และยังไม่เลยวันปิด)
    if (endDate.getTime() - now.getTime() > fifteenDaysInMs) {
        return NextResponse.json({ message: "ยังไม่ถึงเวลาเปิดโหวต (ระบบไม่ได้ส่งเมล)" }, { status: 200 });
    }
    if (now > endDate) {
        return NextResponse.json({ message: "หมดเขตโหวตแล้ว" }, { status: 200 });
    }

    // 3. หาคนที่มีสิทธิ์โหวต (บริจาคแล้วในรอบนี้ + ผ่านการยืนยันตัวตน)
    const eligibleVoters = await prisma.user.findMany({
        where: {
          id: { gt: lastId }, // เอาเฉพาะคนที่มี ID มากกว่า lastId (ส่งต่อจากงวดที่แล้ว)
          role: { in: ['ALUMNI', 'STUDENT'] },
          verification: { status: 'APPROVED' },
          budgetDonations: { 
              some: { 
                  budgetRoundId: Number(roundId),
                  status: 'SUCCESS',
                  deletedAt: null
              } 
          }
        },
        take: limit, // ดึงมาแค่ 400 คน
        orderBy: { id: 'asc' }, // เรียงตาม ID เพื่อให้ไล่ลำดับถูก
        select: { id: true, email: true, fullName: true }
    });

    console.log(`[DEBUG] Database Found: ${eligibleVoters.length} users`);
    eligibleVoters.forEach(u => console.log(` - Found User: ID ${u.id} (${u.email})`));

    if (eligibleVoters.length === 0) {
        return NextResponse.json({ message: "ส่งครบทุกคนแล้ว (ไม่พบรายชื่อเพิ่ม)", nextId: null }, { status: 200 });
    }

    // 4. (Optional) กรองเฉพาะคนที่ "ยังไม่ได้โหวต" เพื่อไม่ให้ Spam คนที่โหวตไปแล้ว
    // ถ้าอยากส่งทุกคนให้ข้าม Step นี้ไป
    const votersToSend = [];
    for (const voter of eligibleVoters) {
        const hasVoted = await prisma.projectVote.findFirst({
            where: {
                alumniId: voter.id,
                proposal: { budgetRoundId: Number(roundId) }
            }
        });
        if (!hasVoted) {
            votersToSend.push(voter);
        } else {
            console.log(`[SKIP] User ID ${voter.id} already voted.`);
        }
    }
    console.log(`[DEBUG] Final to Send: ${votersToSend.length} users`);

    // 5. ส่งอีเมล (Batch Sending)
    const voteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/user/vote`;
    
    let sentCount = 0;
    
    // วนลูปส่งทีละคน (Sequential) เพื่อป้องกัน SMTP Error และลดภาระ Server
    for (const voter of votersToSend) {
        try {
            const mailSubject = `🔔 แจ้งเตือน: เปิดให้โหวตโครงการรอบ ${round.roundName} แล้ว`;
            const mailHtml = `
              <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                <h2 style="color: #F26522;">ได้เวลาโหวตโครงการที่คุณชอบ!</h2>
                <p>เรียนคุณ <strong>${voter.fullName}</strong>,</p>
                <p>ขณะนี้เข้าสู่ช่วงโค้งสุดท้ายของการพิจารณางบประมาณรอบ <strong>"${round.roundName}"</strong> แล้ว</p>
                
                <p>ท่านสามารถใช้สิทธิ์โหวตเพื่อสนับสนุนโครงการที่ท่านเห็นว่าเหมาะสมได้ตั้งแต่วันนี้ จนถึง ${round.endDate ? new Date(round.endDate).toLocaleDateString('th-TH') : '-'}</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${voteLink}" style="background-color: #F26522; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">ไปที่หน้าโหวต</a>
                </div>
                <p style="color: #666; font-size: 12px;">*ท่านได้รับอีเมลนี้เนื่องจากท่านได้ร่วมบริจาคในรอบงบประมาณนี้</p>
              </div>
            `;
            
            await transporter.sendMail({ ...mailOptions, to: voter.email, subject: mailSubject, html: mailHtml });
            sentCount++;
            
            // หน่วงเวลา 0.5 วินาที ก่อนส่งคนต่อไป (ป้องกัน Gmail มองว่าเป็น Spam)
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (err) {
            console.error(`Failed to send email to ${voter.email}:`, err);
            // ไม่ throw error เพื่อให้ลูปทำงานต่อจนจบครบทุกคน
        }
    }

    // หา ID ของคนสุดท้ายในรอบนี้ (เพื่อส่งกลับไปให้ Admin จดไว้ใช้รอบหน้า)
    const lastProcessedId = votersToSend.length > 0 ? votersToSend[votersToSend.length - 1].id : null;

    return NextResponse.json({ 
        message: `ส่งอีเมลสำเร็จ ${sentCount} ฉบับ`, 
        sentCount: sentCount,
        lastId_for_next_batch: lastProcessedId // ใช้เลขนี้ใส่ในช่อง lastId ของวันพรุ่งนี้
    }, { status: 200 });

  } catch (error) {
    console.error("Email Cron Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}