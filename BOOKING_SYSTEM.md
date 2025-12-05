# Booking & Content Management System

## Overview
ระบบจัดการการจองและเนื้อหา (Booking & Content Management System) ที่เชื่อมต่อกับระบบผู้ใช้งานและระบบของที่ระลึกที่มีอยู่แล้ว

## Database Schema

### Models

#### BookingForm
ฟอร์มสำหรับสร้างงานกิจกรรม/อีเวนต์
- `Type`: ประเภทงาน (REUNION, CAMP, SEMINAR, WORKSHOP, OTHER)
- `PriceType`: รูปแบบราคา (SINGLE, BY_BATCH, FREE)
- `batchPrices`: ราคาแต่ละรอบ (JSON format)
- `Souvenir`: มีของที่ระลึกหรือไม่ (HAVE, NOT)

#### BookingField
ข้อมูลที่ผู้ใช้กรอกในการจอง
- `BatchNumber`: รอบที่เลือก
- `BookingSeats`: จำนวนที่นั่ง
- `Name1-4`: ชื่อผู้เข้าร่วม
- `TotalPrice`: ราคารวม

#### Booking
การจองของผู้ใช้
- เชื่อมกับ User (ผู้จอง)
- เชื่อมกับ Content (เนื้อหา/กิจกรรม)
- เชื่อมกับ BookingForm (ฟอร์มจอง)
- เชื่อมกับ Payment (การชำระเงิน)
- เชื่อมกับ Attendee (ผู้เข้าร่วม)
- `transactionStatus`: สถานะธุรกรรม (PENDING, SUCCESS, FAILED)

#### Attendee
ผู้เข้าร่วมในแต่ละการจอง
- สามารถมีหลายคนต่อ 1 booking
- เชื่อมกับ CheckinLog สำหรับบันทึกการเช็คอิน

#### CheckinLog
บันทึกการเช็คอินของผู้เข้าร่วม
- `Date`: วันที่เช็คอิน
- `Name`: ชื่อผู้เช็คอิน

#### Content
เนื้อหา/ข่าวสาร/กิจกรรม
- `categories`: หมวดหมู่ (NEWS, EVENT, ANNOUNCEMENT, ACTIVITY, GENERAL)
- เชื่อมกับ User (ผู้สร้าง)
- เชื่อมกับ BookingForm (ถ้ามีการจอง)
- เชื่อมกับ Status (สถานะเนื้อหา)
- เชื่อมกับ PictureContent (รูปภาพ)

#### PictureContent
รูปภาพที่เกี่ยวข้องกับเนื้อหา

#### Status
สถานะของเนื้อหา (เช่น draft, published, archived)

#### Payment
การชำระเงิน
- `amount`: จำนวนเงิน
- `paymentMethod`: วิธีชำระเงิน (credit_card, bank_transfer, qr_code)
- `status`: สถานะการชำระ (PENDING, SUCCESS, FAILED)
- `referenceNo`: เลขที่อ้างอิง/slip

## API Endpoints

### Booking API (`/api/booking`)

#### GET - ดึงรายการ booking ทั้งหมด
```typescript
Response: {
  bookings: Booking[]
}
```

#### POST - สร้าง booking ใหม่
```typescript
Request Body: {
  userId: number
  contentId: number
  bookingFormId: number
  bookingField?: {
    batchNumber: string
    bookingSeats: number
    name1?: string
    name2?: string
    name3?: string
    name4?: string
    totalPrice: number
    souvenir?: string
    note?: string
  }
  attendees?: string[] // array of names
}

Response: {
  message: string
  booking: Booking
}
```

### Content API (`/api/content`)

#### GET - ดึงรายการ content
```typescript
Query Params:
  ?category=NEWS|EVENT|ANNOUNCEMENT|ACTIVITY|GENERAL

Response: {
  contents: Content[]
}
```

#### POST - สร้าง content ใหม่
```typescript
Request Body: {
  description: string
  author: string
  userId: number
  bookingFormId?: number
  statusId?: number
  categories: ContentCategoryType
  pictures?: string[] // array of image paths
}

Response: {
  message: string
  content: Content
}
```

### BookingForm API (`/api/booking-form`)

#### GET - ดึงรายการ booking form
```typescript
Response: {
  bookingForms: BookingForm[]
}
```

#### POST - สร้าง booking form ใหม่
```typescript
Request Body: {
  type: EventType
  batchNumber?: number
  totalSeats?: number
  startDate?: string
  endDate?: string
  priceType: PriceMode
  batchPrices?: any // JSON object
  souvenir: SouvenirOption
}

Response: {
  message: string
  bookingForm: BookingForm
}
```

#### PUT - อัพเดท booking form
```typescript
Request Body: {
  id: number
  // ... same fields as POST
}

Response: {
  message: string
  bookingForm: BookingForm
}
```

## Relations

### User Relations
- `bookings[]` - การจองทั้งหมดของผู้ใช้
- `contents[]` - เนื้อหาที่ผู้ใช้สร้าง

### BookingForm Relations
- `contents[]` - เนื้อหาที่ใช้ฟอร์มนี้
- `bookings[]` - การจองที่ใช้ฟอร์มนี้

### Booking Relations
- `user` - ผู้จอง
- `content` - เนื้อหาที่จอง
- `bookingField` - ข้อมูลการจอง
- `payment` - การชำระเงิน
- `bookingForm` - ฟอร์มที่ใช้
- `attendees[]` - ผู้เข้าร่วม

### Content Relations
- `user` - ผู้สร้าง
- `bookingForm` - ฟอร์มจอง (ถ้ามี)
- `status` - สถานะ
- `pictures[]` - รูปภาพ
- `bookings[]` - การจอง

## Usage Examples

### 1. สร้าง BookingForm สำหรับงาน Reunion
```typescript
const form = await prisma.bookingForm.create({
  data: {
    Type: 'REUNION',
    BatchNumber: 3,
    TotalSeats: 100,
    StartDate: new Date('2025-06-01'),
    EndDate: new Date('2025-06-03'),
    PriceType: 'BY_BATCH',
    batchPrices: {
      batch1: 1500,
      batch2: 2000,
      batch3: 2500,
    },
    Souvenir: 'HAVE',
  },
});
```

### 2. สร้าง Content พร้อม BookingForm
```typescript
const content = await prisma.content.create({
  data: {
    Description: 'งานคืนสู่เหย้า 2025',
    Author: 'Admin',
    Userid: 1,
    BookingFormID: form.id,
    categories: 'EVENT',
    pictures: {
      create: [
        { Path: '/uploads/event1.jpg' },
        { Path: '/uploads/event2.jpg' },
      ],
    },
  },
});
```

### 3. สร้าง Booking พร้อม Attendees
```typescript
const booking = await prisma.booking.create({
  data: {
    Userid: userId,
    ContentID: contentId,
    bookingFormId: formId,
    transactionStatus: 'PENDING',
    bookingField: {
      create: {
        BatchNumber: '1',
        BookingSeats: 2,
        Name1: 'คนที่ 1',
        Name2: 'คนที่ 2',
        TotalPrice: 3000,
      },
    },
    attendees: {
      create: [
        { Name: 'คนที่ 1' },
        { Name: 'คนที่ 2' },
      ],
    },
  },
});
```

### 4. เช็คอิน Attendee
```typescript
await prisma.checkinLog.create({
  data: {
    AttendeeID: attendeeId,
    Name: 'คนที่ 1',
    Date: new Date(),
  },
});
```

### 5. สร้าง Payment
```typescript
const payment = await prisma.payment.create({
  data: {
    amount: 3000,
    paymentMethod: 'bank_transfer',
    status: 'SUCCESS',
    referenceNo: 'TXN202512050001',
  },
});

// เชื่อมกับ Booking
await prisma.booking.update({
  where: { id: bookingId },
  data: {
    PaymentID: payment.id,
    transactionStatus: 'SUCCESS',
  },
});
```

## Integration with Existing Systems

### กับระบบ User
- ใช้ `User.bookings[]` และ `User.contents[]`
- ผู้ใช้สามารถสร้างและจองกิจกรรมได้

### กับระบบ Souvenir
- `BookingForm.Souvenir` ระบุว่ามีของที่ระลึกหรือไม่
- สามารถเชื่อม `Booking` กับ `Entitlement` ได้ผ่าน custom logic

## Migration

ใช้คำสั่งนี้เพื่อสร้างตารางในฐานข้อมูล:
```bash
npx prisma migrate dev --name add_booking_content_management_system
```

หรือถ้าต้องการ reset database:
```bash
npx prisma migrate reset --force
```

## Notes

- ฟิลด์ `Date` ใน Booking เป็น `DateTime` และมีค่า default เป็นเวลาปัจจุบัน
- `BookingField` และ `Payment` มี 1:1 relationship กับ `Booking`
- `transactionStatus` ใน Booking จะอัพเดทตามสถานะของ Payment
- ใช้ `categories` ใน Content เพื่อแยกประเภทเนื้อหา
- `batchPrices` เป็น JSON field สามารถเก็บโครงสร้างข้อมูลที่ยืดหยุ่นได้
