Team 02 – School of Engineering, SUT
| 👩‍💻 Name | 🆔 Student ID | 💼 SubSystem 1 | 💼 SubSystem 2 |
|------------|---------------|----------|----------|
| นายณัฐพงศ์ ทองเถาะ | B6612894 | ระบบระดมทุนและบริจาค | ระบบชำระเงิน |
| นางสาวโยษิตา นันทดิลก | B6630485 | ระบบข่าวสารและกิจกรรม | ระบบจองกิจกรรม |
| นางสาวชุติกาญจน์ ชมกลาง | B6631345 | ระบบสมาชิกและการลงทะเบียน | ระบบจัดการของที่ระลึก  |
| นายจิรวัฒน์  ซาด้วง | B6641948 | ระบบประกาศรับสมัครงาน | ระบบพูดคุยศิษย์เก่า |
| นางสาวพนิดา โต๊ะเหลือ | B6643041 | ระบบพิจารณาและอนุมัติการใช้งบประมาณ | ระบบสรุปผลและติดตามงบประมาณ |

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- Docker and Docker Compose

### Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL Database**
   ```bash
   docker-compose up -d db
   ```
   This will start a PostgreSQL database container on port 5432.

3. **Create Environment File**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database (required)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"

   # JWT Secret (required)
   JWT_SECRET="your-secret-key-change-this-in-production"

   # Email Configuration (optional - for email features)
   GMAIL_USER="your-email@gmail.com"
   GMAIL_PASS="your-app-password"

   # Application URL (optional)
   NEXTAUTH_URL="http://localhost:3000"

   # Upload Directories (optional)
   UPLOAD_DIR="uploads"
   POSTER_UPLOAD_DIR="uploads/posters"
   ```

4. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```
   Or if you want to create a new migration:
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Seed the Database** (optional but recommended)
   ```bash
   npm run seed
   ```
   This will create initial admin and test users. Default admin credentials:
   - Email: `admin@sut-eng.ac.th`
   - Password: `sut12345`

7. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### Quick Setup (All-in-One)
```bash
# Install dependencies
npm install

# Start database
docker-compose up -d db

# Create .env file (copy and modify the template above)

# Setup database
npx prisma migrate deploy
npx prisma generate

# Seed database (optional)
npm run seed

# Start server
npm run dev
```

### Other Useful Commands

- **Run Tests**: `npm test`
- **Run E2E Tests**: `npm run test:e2e`
- **Build for Production**: `npm run build`
- **Start Production Server**: `npm start`
- **View Database**: Use Prisma Studio
  ```bash
  npx prisma studio
  ```

### Troubleshooting

- **Database connection issues**: Make sure Docker is running and the database container is up (`docker ps`)

- **Migration Error P3009 (Failed Migration)**: This happens when a migration was interrupted. For a fresh setup, reset the database:
  ```bash
  # Option 1: Reset database (recommended for development - deletes all data)
  npx prisma migrate reset
  
  # Option 2: Manually resolve failed migration (for production)
  # Connect to database and check the _prisma_migrations table
  # Then mark the failed migration as rolled back:
  npx prisma migrate resolve --rolled-back 20251205095840_add_booking_content_management_system
  # Then retry:
  npx prisma migrate deploy
  ```

- **Port already in use**: Change the port in `docker-compose.yml` or stop the service using port 5432
