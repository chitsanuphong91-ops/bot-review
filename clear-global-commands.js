require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (!process.env.CLIENT_ID) {
      throw new Error('ไม่พบ CLIENT_ID ใน .env');
    }

    console.log('🔍 กำลังลบคำสั่งแบบ Global ทั้งหมด (คำสั่งแบบ Guild จะไม่ถูกแตะต้อง)...');

    // การส่ง array ว่างไปที่ endpoint นี้ = ล้างคำสั่ง Global ทั้งหมด
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] },
    );

    console.log('✅ ลบคำสั่งแบบ Global เรียบร้อยแล้ว เหลือแค่แบบ Guild ตาม GUILD_ID');
  } catch (error) {
    console.error('❌ ลบคำสั่งล้มเหลว:', error);
  }
})();
