# Docker & Azure Deployment Guide

## ขั้นตอนที่ 1: ตรวจสอบและ Build Docker Image

### 1.1 ตรวจสอบ Dockerfile
```bash
# ไปที่โปรเจค
cd d:\CPE28\Y3\T2\Software\ Engineering\SE\ -\ Project\team02

# ตรวจสอบไฟล์ที่จำเป็น
dir Dockerfile
dir docker-compose.yml
```

### 1.2 Build Docker Image
```bash
# Build image
docker-compose build

# ตรวจสอบ image ที่สร้างเสร็จ
docker images
```

**Output ควรเห็น:**
```
REPOSITORY                    TAG       IMAGE ID      CREATED
next-app                      latest    xxxxx         x seconds ago
```

---

## ขั้นตอนที่ 2: Push Docker Image ไปยัง Docker Hub

### 2.1 สร้างบัญชี Docker Hub
1. ไปที่ https://hub.docker.com
2. คลิก **Sign Up**
3. กรอก:
   - Username: `your-username` (ตัวอักษรพิมพ์เล็กเท่านั้น)
   - Email: ใช้อีเมล
   - Password: ตั้งรหัส
4. ยืนยันอีเมล

### 2.2 Login Docker CLI
```bash
# Login เข้า Docker Hub
docker login

# ป้อนข้อมูล:
# Username: your-docker-username
# Password: your-docker-password
```

**ผลลัพธ์:**
```
Login Succeeded
```

### 2.3 Tag และ Push Image
```bash
# Tag image ให้พร้อม push
docker tag next-app:latest your-docker-username/next-app:latest
docker tag next-app:latest your-docker-username/next-app:v1.0

# Verify tag
docker images | grep next-app

# Push ไปยัง Docker Hub
docker push your-docker-username/next-app:latest
docker push your-docker-username/next-app:v1.0
```

**Output ควรเห็น:**
```
The push refers to repository [docker.io/your-username/next-app]
v1.0: digest: sha256:xxxxx
latest: digest: sha256:xxxxx
```

### 2.4 ยืนยันใน Docker Hub
```bash
# ตรวจสอบ repository
docker search your-docker-username/next-app
```

---

## ขั้นตอนที่ 3: สมัครใช้งาน Microsoft Azure

### 3.1 สมัคร Azure for Students
1. ไปที่ https://azure.microsoft.com/en-us/free/students
2. คลิก **Activate Now**
3. Login ด้วย:
   - School/University Account (ถ้ามี)
   - หรือ Microsoft Account ส่วนตัว
4. ยืนยันตัวตน (อาจต้องใช้บัตรประชาชน/หนังสือเดินทาง)
5. ได้ Credit: **$100 ฟรี** (12 เดือน)

### 3.2 ตั้งค่า Azure Subscription
1. ไปที่ https://portal.azure.com
2. ค้นหา "Subscriptions"
3. ตรวจสอบ Credit ที่เหลือ
4. ตั้ง Budget Alert (ไม่ให้เกินงบประมาณ)

---

## ขั้นตอนที่ 4: สร้าง Virtual Machine บน Azure

### 4.1 สร้าง VM
1. ไปที่ https://portal.azure.com
2. คลิก **Create a resource** → **Virtual machines**
3. กรอกข้อมูล:

**Project Details:**
- Subscription: เลือก subscription ของคุณ
- Resource group: Create new → `team02-rg`

**Instance Details:**
- Virtual machine name: `team02-vm`
- Region: `East Asia` หรือ `Southeast Asia` (เร็วสำหรับไทย)
- Image: `Ubuntu 22.04 LTS - x64 Gen2`
- Size: `Standard_B1s` (1 vCPU, 1 GB RAM - ฟรี)

**Administrator Account:**
- Username: `azureuser`
- SSH public key source: **Generate new key pair**
  - Key pair name: `team02-key`
  - ⚠️ **Save ไฟล์ .pem ให้ดี!**

**Inbound port rules:**
- Select inbound ports:
  - ✅ HTTP (80)
  - ✅ HTTPS (443)
  - ✅ SSH (22)

4. คลิก **Review + create** → **Create**

### 4.2 ดาวน์โหลด SSH Key
1. เมื่อ VM สร้างเสร็จ จะได้ไฟล์ `team02-key.pem`
2. บันทึกไฟล์ลง folder ใดๆ เช่น `C:\Users\YourName\.ssh\`
3. สำหรับ Windows: ใช้ PuTTY หรือ Windows Terminal

---

## ขั้นตอนที่ 5: เชื่อมต่อ VM ผ่าน SSH

### 5.1 รับ Public IP Address
1. ไปที่ https://portal.azure.com
2. ค้นหา Virtual Machines
3. คลิก `team02-vm`
4. Copy **Public IP address** (เช่น `40.81.xxx.xxx`)

### 5.2 เชื่อมต่อจาก Windows

#### ใช้ Windows Terminal/PowerShell:
```bash
# ตั้งค่า Permission สำหรับ SSH Key (Windows PowerShell as Admin)
icacls "C:\Users\YourName\.ssh\team02-key.pem" /inheritance:r /grant:r "$env:UserName:F"

# เชื่อมต่อ VM
ssh -i "C:\Users\YourName\.ssh\team02-key.pem" azureuser@40.81.xxx.xxx

# ตอบ yes เมื่อถูกถาม "Are you sure?"
```

#### ใช้ PuTTY:
1. ดาวน์โหลด PuTTY + PuTTYgen
2. ใช้ PuTTYgen แปลง `.pem` เป็น `.ppk`
3. เปิด PuTTY:
   - Host Name: `azureuser@40.81.xxx.xxx`
   - SSH → Auth → Private key: เลือก `.ppk`
   - Open

### 5.3 ยืนยันการเชื่อมต่อ
```bash
# ควรเห็น prompt
azureuser@team02-vm:~$

# ตรวจสอบข้อมูล VM
uname -a
```

---

## ขั้นตอนที่ 6: ติดตั้ง Docker และ Docker Compose

### 6.1 อัปเดต System
```bash
# Update package manager
sudo apt-get update
sudo apt-get upgrade -y
```

### 6.2 ติดตั้ง Docker
```bash
# ติดตั้ง Docker CE (Community Edition)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# เพิ่มผู้ใช้ปัจจุบันเข้า docker group
sudo usermod -aG docker $USER

# Activate the change
newgrp docker

# ตรวจสอบ Docker
docker --version
```

**Output:**
```
Docker version 27.x.x, build xxxxx
```

### 6.3 ติดตั้ง Docker Compose
```bash
# ดาวน์โหลด Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# ตั้งค่า Permission
sudo chmod +x /usr/local/bin/docker-compose

# ตรวจสอบ
docker-compose --version
```

**Output:**
```
Docker Compose version 2.x.x
```

### 6.4 เปิด SSH Key ใหม่ (เพื่อให้ Docker commands ทำงาน)
```bash
# ออกจาก SSH
exit

# เชื่อมต่อใหม่
ssh -i "C:\Users\YourName\.ssh\team02-key.pem" azureuser@40.81.xxx.xxx

# ตรวจสอบ Docker
docker ps
```

---

## ขั้นตอนที่ 7: Pull Docker Image และ Run

### 7.1 Pull Image จาก Docker Hub
```bash
# Login Docker Hub (ถ้ายังไม่ login)
docker login

# Pull image
docker pull your-docker-username/next-app:latest

# ตรวจสอบ
docker images
```

### 7.2 สร้าง .env file
```bash
# สร้าง directory สำหรับ project
mkdir ~/myapp
cd ~/myapp

# สร้าง .env file
nano .env
```

**กรอกข้อมูล .env:**
```env
# Database
DATABASE_URL=postgres://postgres:postgres@db:5432/mydb

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://40.81.xxx.xxx
```

หรือถ้าใช้ PORT 80:
```env
NEXT_PUBLIC_API_URL=http://40.81.xxx.xxx:80
```

บันทึก: **Ctrl+O** → Enter → **Ctrl+X**

### 7.3 สร้าง docker-compose.yml
```bash
nano docker-compose.yml
```

**กรอกข้อมูล:**
```yaml
version: "3.9"

services:
  web:
    image: your-docker-username/next-app:latest
    container_name: next-app
    restart: unless-stopped
    ports:
      - "80:3000"  # Port 80 (HTTP) → Container Port 3000
    env_file:
      - .env
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/mydb
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    container_name: next-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres" ]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  db_data:

networks:
  app-network:
    driver: bridge
```

บันทึก: **Ctrl+O** → Enter → **Ctrl+X**

### 7.4 เปิด Port 80 ใน Azure Network Security Group
```bash
# ยังอยู่ใน SSH shell

# ตรวจสอบ Port 80
sudo netstat -tlnp | grep :80
```

**ใน Azure Portal:**
1. ไปที่ Virtual Machine `team02-vm`
2. คลิก **Networking**
3. คลิก **Add inbound port rule**
   - Source: Any
   - Source port ranges: *
   - Destination: Any
   - Service: HTTP
   - Action: Allow
4. Save

### 7.5 ติดตั้ง sudo สำหรับ Docker (ถ้าจำเป็น)
```bash
# ตรวจสอบว่า user อยู่ใน docker group แล้ว
groups $USER
```

ถ้าไม่เห็น docker:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 7.6 Start Services
```bash
# ไปที่ directory
cd ~/myapp

# Start services (ไม่มี sudo)
docker-compose up -d

# ตรวจสอบ logs
docker-compose logs -f

# ตรวจสอบ containers
docker-compose ps
```

**Output ควรเห็น:**
```
CONTAINER ID   IMAGE                              PORTS
xxxxx          your-username/next-app:latest     0.0.0.0:80->3000/tcp
xxxxx          postgres:16-alpine                5432/tcp
```

### 7.7 Apply Prisma Migrations (ถ้าจำเป็น)
```bash
# ไปภายใน web container
docker-compose exec web npx prisma migrate deploy

# Seed database (optional)
docker-compose exec web npx tsx prisma/seed.ts
```

---

## ขั้นตอนที่ 8: ทดสอบการเข้าถึง

### 8.1 เข้าผ่าน Browser
```
http://40.81.xxx.xxx
http://40.81.xxx.xxx:80
```

**ควรเห็นหน้า Next.js application**

### 8.2 ตรวจสอบ Health Check
```bash
# จาก VM
curl http://localhost

# จาก Local (Windows)
curl http://40.81.xxx.xxx
```

---

## ขั้นตอนที่ 9: Maintenance

### ดูตัวบันทึก (Logs)
```bash
docker-compose logs -f            # ทั้งหมด
docker-compose logs -f web        # เฉพาะ web
docker-compose logs -f db         # เฉพาะ database
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Update Image
```bash
# Pull latest image
docker pull your-docker-username/next-app:latest

# Restart
docker-compose down
docker-compose up -d
```

---

## ⚠️ ข้อควรระวัง

| ข้อ | คำอธิบาย |
|-----|---------|
| 🔑 SSH Key | บันทึก `.pem` ให้ปลอดภัย! |
| 💰 Azure Credit | ตรวจสอบ Credit ว่าหมดหรือไม่ |
| 🔓 Security | เปิด Port เฉพาะที่จำเป็น |
| 📝 Backups | Backup database บ่อยๆ |
| 🔄 Auto-restart | `restart: unless-stopped` จะ restart เมื่อ reboot |

---

## 🆘 แก้ไขปัญหาทั่วไป

### Docker command: permission denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Cannot connect to Port 80
```bash
# ตรวจสอบ Azure NSG
# ตรวจสอบ firewall ใน VM
sudo ufw allow 80/tcp
```

### Container exit immediately
```bash
docker-compose logs web
# ดูว่า error อะไร แล้วแก้ไข
```

### Database not connecting
```bash
# ตรวจสอบ DATABASE_URL ใน .env
# ตรวจสอบ db container running
docker-compose ps
```

---

**✅ การเสร็จสิ้น:** เมื่อสามารถเข้า http://40.81.xxx.xxx ได้ ตั้งสำเร็จแล้ว! 🎉
