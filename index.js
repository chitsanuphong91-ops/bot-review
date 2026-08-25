require('dotenv').config();
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

// ---------- Keep-alive web server (จำเป็นสำหรับ Render Web Service) ----------
const app = express();
app.get('/', (req, res) => res.send('Review bot is running ✅'));
app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Keep-alive server listening on port ${process.env.PORT || 3000}`);
});

// ---------- Discord client ----------
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const REVIEW_BUTTON_ID = 'open_review_modal';
const REVIEW_MODAL_ID = 'review_modal';
const RATING_INPUT_ID = 'review_rating';
const COMMENT_INPUT_ID = 'review_comment';

client.once('ready', () => {
  console.log(`🤖 ล็อกอินสำเร็จในชื่อ ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    // ---------- /setup-review : โพสต์แผงปุ่ม ----------
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-review') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: '❌ ต้องมีสิทธิ์ Manage Server ถึงจะใช้คำสั่งนี้ได้',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('⭐ แบ่งปันรีวิวของคุณ')
        .setDescription(
          'กดปุ่ม **📝 เขียนรีวิว** ด้านล่างเพื่อให้คะแนนและเล่าประสบการณ์ของคุณ\n' +
          'รีวิวของคุณจะถูกโพสต์ลงในห้องนี้ทันที ไม่ต้องพิมพ์คำสั่งใดๆ'
        )
        .setFooter({
          text: `${interaction.guild?.name ?? 'ร้านของเรา'} • ขอบคุณที่สละเวลารีวิวให้เรา 💜`,
          iconURL: interaction.guild?.iconURL() || undefined,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(REVIEW_BUTTON_ID)
          .setLabel('เขียนรีวิว')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Success),
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: '✅ ตั้งค่าแผงรีวิวเรียบร้อย', ephemeral: true });
    }

    // ---------- กดปุ่ม "เขียนรีวิว" -> เด้ง Modal ----------
    if (interaction.isButton() && interaction.customId === REVIEW_BUTTON_ID) {
      const modal = new ModalBuilder()
        .setCustomId(REVIEW_MODAL_ID)
        .setTitle('เขียนรีวิว');

      const ratingInput = new TextInputBuilder()
        .setCustomId(RATING_INPUT_ID)
        .setLabel('ให้คะแนน (1-5)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ใส่ตัวเลข 1 ถึง 5')
        .setMinLength(1)
        .setMaxLength(1)
        .setRequired(true);

      const commentInput = new TextInputBuilder()
        .setCustomId(COMMENT_INPUT_ID)
        .setLabel('ความคิดเห็นของคุณ')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('เล่าประสบการณ์ของคุณ...')
        .setMaxLength(1000)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(ratingInput),
        new ActionRowBuilder().addComponents(commentInput),
      );

      return interaction.showModal(modal);
    }

    // ---------- ส่ง Modal -> โพสต์รีวิวลงห้อง ----------
    if (interaction.isModalSubmit() && interaction.customId === REVIEW_MODAL_ID) {
      const ratingRaw = interaction.fields.getTextInputValue(RATING_INPUT_ID).trim();
      const comment = interaction.fields.getTextInputValue(COMMENT_INPUT_ID).trim();

      const rating = parseInt(ratingRaw, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return interaction.reply({
          content: '❌ กรุณาใส่คะแนนเป็นตัวเลข 1-5 เท่านั้น ลองกดปุ่มรีวิวใหม่อีกครั้ง',
          ephemeral: true,
        });
      }

      const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

      // สีของ embed จะไล่ตามคะแนน — 5 ดาว = ทอง, 4 = เขียว, 3 = เหลือง, 2-1 = แดง
      const ratingColors = { 5: 0xffd700, 4: 0x57f287, 3: 0xfee75c, 2: 0xed4245, 1: 0xed4245 };

      const reviewEmbed = new EmbedBuilder()
        .setColor(ratingColors[rating] ?? 0xfee75c)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `✅ **รีวิวจากลูกค้าจริง • ${interaction.guild?.name ?? ''}**\n\n` +
          `> *"${comment.replace(/\n/g, '\n> ')}"*`
        )
        .addFields(
          { name: '⭐ คะแนน', value: `${stars}  **${rating}/5**`, inline: true },
          { name: '👤 รีวิวโดย', value: `<@${interaction.user.id}>`, inline: true },
        )
        .setFooter({ text: 'ขอบคุณสำหรับรีวิว 💜' })
        .setTimestamp();

      const reviewChannelId = process.env.REVIEW_CHANNEL_ID;
      const targetChannel = reviewChannelId
        ? await client.channels.fetch(reviewChannelId).catch(() => null)
        : interaction.channel;

      if (!targetChannel) {
        return interaction.reply({
          content: '❌ ไม่พบห้องรีวิว กรุณาตรวจสอบค่า REVIEW_CHANNEL_ID',
          ephemeral: true,
        });
      }

      await targetChannel.send({ embeds: [reviewEmbed] });

      return interaction.reply({
        content: '✅ ขอบคุณสำหรับรีวิวของคุณ!',
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดใน interactionCreate:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
