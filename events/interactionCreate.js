const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const LOA_FILE = path.join(__dirname, "../data/loas.json");
if (!fs.existsSync(LOA_FILE)) fs.writeFileSync(LOA_FILE, JSON.stringify({}));

// ✅ .env থেকে Allowed Roles লোড
const ALLOWED_APPROVE_ROLES = process.env.ALLOWED_APPROVE_ROLES
  ? process.env.ALLOWED_APPROVE_ROLES.split(",")
  : [];

module.exports = async (interaction, client) => {
  try {
    // =========================================================
    // SLASH COMMAND HANDLER
    // =========================================================
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`❌ Error running command ${interaction.commandName}:`, err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "⚠️ Command failed.", ephemeral: true });
        }
      }
      return;
    }

    // =========================================================
    // BUTTON HANDLER (LOA APPROVE / REJECT)
    // =========================================================
    if (!interaction.isButton()) return;

    const [prefix, action, userId] = interaction.customId.split("_");
    if (prefix !== "loa" || !["approve", "cancel"].includes(action)) return;

    // 🔒 Permission Check
    const allowed = interaction.member.roles.cache.some(r => ALLOWED_APPROVE_ROLES.includes(r.id));
    if (!allowed) {
      return interaction.reply({
        content: "⛔ You don’t have permission to approve/reject LOA requests.",
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ Member not found.", ephemeral: true });
    }

    // Load LOA DB
    let loas = {};
    if (fs.existsSync(LOA_FILE)) {
      loas = JSON.parse(fs.readFileSync(LOA_FILE, "utf8"));
    }

    // ❌ পুরানো মেসেজ মুছে দিই (with buttons)
    await interaction.message.delete().catch(() => {});

    // =========================================================
    // APPROVE HANDLER
    // =========================================================
    if (action === "approve") {
      if (loas[userId]) {
        loas[userId].status = "approved";
        loas[userId].approver = interaction.user.id;
        fs.writeFileSync(LOA_FILE, JSON.stringify(loas, null, 2));
      }

      const userLoa = loas[userId] || {};

      const approveEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ **LOA APPROVED**")
        .setDescription(
        `🎉 **Your Leave of Absence (LOA) request has been approved!**\n` +
        `Enjoy your break and return stronger.\n\n` +
        `👤 **Member:** ${member}\n` +
        `🛡️ **Approved By:** ${interaction.user}`
        )
        .addFields(
          { name: "📝 **Reason Provided**", value: userLoa.reason || "N/A", inline: false },
          { name: "⏳ **Requested Duration**", value: userLoa.duration || "N/A", inline: true },
          { name: "📅 **End Time (BD)**", value: userLoa.endTime || "N/A", inline: true }
        )
        .setFooter({
          text: "⚔️ ROYAL SYNDICATE •",
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      // ✅ LOA Channel
      interaction.channel.send({ embeds: [approveEmbed] });

      // ✅ DM
      try {
        await member.send({ embeds: [approveEmbed] });
      } catch (err) {
        console.warn("⚠️ Could not DM member:", err.message);
      }

      // ✅ Log Channel
      const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [approveEmbed] });
    }

    // =========================================================
    // REJECT HANDLER
    // =========================================================
    if (action === "cancel") {
      if (loas[userId]) {
        loas[userId].status = "rejected";
        loas[userId].rejectedBy = interaction.user.id;
        fs.writeFileSync(LOA_FILE, JSON.stringify(loas, null, 2));
      }

      const rejectEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("❌ **LOA REJECTED**")
        .setDescription(
        `⚠️ **Your Leave of Absence (LOA) request has been rejected!**\n` +
        `Please contact staff for more information.\n\n` +
        `👤 **Member:** ${member}\n` +
        `⛔ **Rejected By:** ${interaction.user}`
       )

        .addFields(
          { name: "📝 **Reason Provided**", value: loas[userId]?.reason || "N/A", inline: false }
        )
        .setFooter({
          text: "⚔️ ROYAL SYNDICATE • ",
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      // ✅ LOA Channel এ send
      interaction.channel.send({ embeds: [rejectEmbed] });

      // ✅ DM send
      try {
        await member.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ **Your LOA Request Rejected!**")
              .setDescription("⚠️ Your **LOA request** has been **rejected**. Please contact staff.")
              .setFooter({ text: "⚔️ Royal Syndicate • ", iconURL: client.user.displayAvatarURL() })
              .setTimestamp()
          ]
        });
      } catch {}

      // ✅ Log Channel
      const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [rejectEmbed] });
    }
  } catch (err) {
    console.error("❌ Interaction handler error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
    }
  }
};
