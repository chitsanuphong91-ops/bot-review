require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-review')
    .setDescription('ตั้งค่าแผงปุ่มสำหรับให้สมาชิกกดรีวิว (ใช้ในห้องที่ต้องการแสดงปุ่ม)')
    .setDefaultMemberPermissions(0) // ซ่อนจากทุกคน ยกเว้นแอดมิน (ManageGuild ขึ้นไป ปรับสิทธิ์ได้ที่ Server Settings > Integrations)
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (!process.env.CLIENT_ID) {
      throw new Error('ไม่พบ CLIENT_ID ใน .env');
    }

    if (process.env.GUILD_ID) {
      // Deploy แบบรายเซิร์ฟเวอร์ -> คำสั่งขึ้นทันที เหมาะกับตอน dev/ทดสอบ
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`✅ Deploy คำสั่งสำเร็จไปที่เซิร์ฟเวอร์ GUILD_ID=${process.env.GUILD_ID}`);
    } else {
      // Deploy แบบ global -> ใช้ได้ทุกเซิร์ฟเวอร์ที่เชิญบอท แต่ใช้เวลาซิงก์ประมาณ 1 ชั่วโมง
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log('✅ Deploy คำสั่งแบบ Global สำเร็จ (อาจใช้เวลาซิงก์ถึง ~1 ชม.)');
    }
  } catch (error) {
    console.error('❌ Deploy คำสั่งล้มเหลว:', error);
  }
})();
