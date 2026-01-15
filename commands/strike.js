const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("strike")
    .setDescription("⚡ Issue a strike to a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user")
        .setDescription("👤 Member to strike")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("📄 Reason for the strike")
        .setRequired(true)
    )
    .addChannelOption(o =>
      o.setName("log")
        .setDescription("📢 Optional log channel for embed")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");

      // ⏳ Processing confirm
      await interaction.reply({ content: `⏳ Processing strike for **${target.tag}**...`, ephemeral: true });

      // 🎨 Embed
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("⚡ STRIKE NOTICE ⚡")
        .setDescription(`**A strike has been issued to ${target}.**`)
        .addFields(
          { name: "👤 **Member**", value: `${target}`, inline: false },
          { name: "📄 **Reason**", value: reason, inline: false },
          { name: "🛠️ **Issued By**", value: `${interaction.user}`, inline: false }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
        .setTimestamp();

      // 📢 Send to log channel (custom or fallback)
      const logChannel =
        interaction.options.getChannel("log") ||
        (process.env.LOG_CHANNEL_ID
          ? await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null)
          : null);

      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }

      // ✅ Confirm update
      await interaction.editReply({ content: `✅ Strike issued to **${target.tag}**.` });
    } catch (err) {
      console.error("❌ Strike command error:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ Failed to issue strike." });
      } else {
        await interaction.reply({ content: "❌ Failed to issue strike.", ephemeral: true });
      }
    }
  }
};
