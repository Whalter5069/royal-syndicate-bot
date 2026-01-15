const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const warns = require("../data/warns.json");

// ✅ warn-log channel
const WARN_LOG_CHANNEL_ID = "1413489012009734204";

// ✅ Main moderation log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("⚠️ Warn a user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to warn")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for warning")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";

      // 📝 Save warn
      if (!warns[user.id]) warns[user.id] = [];
      warns[user.id].push({ reason, mod: interaction.user.tag, date: new Date() });

      fs.writeFileSync("./data/warns.json", JSON.stringify(warns, null, 2));

      // ✅ Reply to moderator
      await interaction.editReply(`⚠️ Warned **${user.tag}** for: **${reason}**`);

      // 📌 Common embed
      const warnEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("⚠️ **User Warned**")
        .addFields(
          { name: "👤 **User**", value: `<@${user.id}> (${user.tag} • ${user.id})`, inline: false },
          { name: "🛠️ **Moderator**", value: `<@${interaction.user.id}> (${interaction.user.tag} • ${interaction.user.id})`, inline: false },
          { name: "📄 **Reason**", value: reason, inline: false },
          { name: "📅 **Date**", value: new Date().toLocaleString(), inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
        .setTimestamp();

      // ✅ Send to warn-log channel
      const warnLogChannel = interaction.guild.channels.cache.get(WARN_LOG_CHANNEL_ID);
      if (warnLogChannel) await warnLogChannel.send({ embeds: [warnEmbed] });

      // ✅ Send to main moderation log channel
      const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
      if (mainLogChannel) await mainLogChannel.send({ embeds: [warnEmbed] });

      // ✅ DM to warned user
      try {
        await user.send(`⚠️ You have been warned in **${interaction.guild.name}**.\nReason: **${reason}**`);
      } catch {
        console.log("❌ Could not DM the warned user.");
      }

    } catch (err) {
      console.error("❌ Error in /warn:", err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Failed to issue warning.", ephemeral: true });
      }
    }
  },
};
