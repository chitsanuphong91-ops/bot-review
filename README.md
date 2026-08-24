# Discord Review Bot 📝⭐

บอทดิสคอร์ดสำหรับให้สมาชิกกดปุ่ม "เขียนรีวิว" แล้วกรอกคะแนน (1-5) + ความคิดเห็นผ่านฟอร์ม (Modal) จากนั้นบอทจะโพสต์เป็น embed สวยๆ ลงในห้องรีวิวอัตโนมัติ รันได้ 24 ชม. บนโฮสต์ฟรีอย่าง Railway/Render

## 1. สร้างบอทใน Discord Developer Portal

1. ไปที่ https://discord.com/developers/applications แล้วกด **New Application**
2. ไปที่แท็บ **Bot** → กด **Reset Token** เพื่อคัดลอก Token (เก็บไว้ใส่ `.env` → `DISCORD_TOKEN`)
3. หน้าเดิม เปิด **Message Content Intent** ไม่จำเป็นสำหรับบอทนี้ (ไม่ได้อ่านข้อความ) แต่เปิดไว้ก็ได้ไม่เสียหาย
4. ไปที่แท็บ **General Information** → คัดลอก **Application ID** ใส่ `.env` → `CLIENT_ID`
5. ไปที่แท็บ **OAuth2 → URL Generator**
   - Scopes: เลือก `bot` และ `applications.commands`
   - Bot Permissions: เลือก `Send Messages`, `Embed Links`, `Use Slash Commands`
   - คัดลอกลิงก์ที่ได้ไปเปิดในเบราว์เซอร์เพื่อเชิญบอทเข้าเซิร์ฟเวอร์

## 2. ติดตั้งโปรเจกต์

```bash
npm install
cp .env.example .env
```

แก้ไฟล์ `.env` ให้ครบ:

```
DISCORD_TOKEN=โทเคนบอทของคุณ
CLIENT_ID=Application ID ของบอท
GUILD_ID=ID เซิร์ฟเวอร์ (ใส่ตอนทดสอบให้คำสั่งขึ้นทันที ลบออกได้ตอน deploy จริง)
REVIEW_CHANNEL_ID=ID ห้องที่ต้องการให้โพสต์รีวิว
PORT=3000
```

> วิธีดู ID: เปิด Discord → Settings → Advanced → เปิด **Developer Mode** แล้วคลิกขวาที่เซิร์ฟเวอร์/ห้อง → Copy ID

## 3. ลงทะเบียนคำสั่ง slash

```bash
npm run deploy
```

## 4. รันบอท

```bash
npm start
```

จากนั้นในห้องไหนก็ได้ พิมพ์ `/setup-review` (ต้องมีสิทธิ์ Manage Server) เพื่อให้บอทโพสต์แผงปุ่ม "เขียนรีวิว" — ทุกคนที่กดปุ่มจะได้กรอกฟอร์ม คะแนน+ความคิดเห็น แล้วบอทจะโพสต์ลงห้องที่กำหนดใน `REVIEW_CHANNEL_ID` ให้อัตโนมัติ

## 5. Deploy ให้รันตลอด 24 ชม.

### แบบ Railway
1. Push โค้ดขึ้น GitHub repo
2. เข้า https://railway.app → **New Project → Deploy from GitHub repo**
3. เลือก repo นี้ → Railway จะรัน `npm install` และ `npm start` ให้อัตโนมัติ
4. ไปที่แท็บ **Variables** ใส่ค่าจาก `.env` ทั้งหมด (DISCORD_TOKEN, CLIENT_ID, REVIEW_CHANNEL_ID, PORT ฯลฯ)
5. Deploy เสร็จบอทจะออนไลน์ตลอด (Railway มี free trial credit ให้ใช้ต่อเดือน ถ้าหมดต้องผูกบัตร/อัปเกรด)

### แบบ Render
1. Push โค้ดขึ้น GitHub repo
2. เข้า https://render.com → **New → Web Service**
3. เชื่อม repo → Build Command: `npm install` → Start Command: `npm start`
4. ไปที่แท็บ **Environment** ใส่ค่าตัวแปรทั้งหมดเหมือนใน `.env`
5. Render free tier จะพักเครื่อง (sleep) ถ้าไม่มี request เข้ามานาน — โค้ดนี้เปิด web server เล็กๆ ไว้ที่ path `/` แล้ว ถ้าอยากกันไม่ให้หลับ ให้ใช้บริการ ping ฟรีเช่น https://uptimerobot.com ตั้ง ping มาที่ URL ของ Render ทุก 5 นาที

> ⚠️ อย่า push ไฟล์ `.env` ขึ้น GitHub เด็ดขาด (มี `.gitignore` กันไว้ให้แล้ว) ให้ตั้งค่าตัวแปรผ่านหน้าเว็บของ Railway/Render แทน

## โครงสร้างไฟล์
```
├── index.js            # โค้ดหลักของบอท (ปุ่ม + modal + โพสต์รีวิว)
├── deploy-commands.js  # สคริปต์ลงทะเบียนคำสั่ง /setup-review
├── package.json
├── .env.example
└── .gitignore
```

## ปรับแต่งเพิ่มเติมที่ทำได้ต่อ
- เก็บรีวิวลงฐานข้อมูล (เช่น SQLite/MongoDB) เพื่อคำนวณคะแนนเฉลี่ยของร้าน/สินค้า
- จำกัดไม่ให้คนเดิมรีวิวซ้ำ (เช่น เช็คจาก user ID ในฐานข้อมูล)
- เพิ่มรูปภาพแนบในรีวิว (ต้องใช้ช่องทางอื่นเพราะ Modal ใส่ไฟล์แนบไม่ได้ — อาจให้แนบลิงก์รูปแทน)
