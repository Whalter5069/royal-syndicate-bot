const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const warns = require("../data/warns.json");

// ✅ Main moderation log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("📋 Check warnings of a user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to check")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("user");

    // ❌ No warnings case
    if (!warns[user.id] || warns[user.id].length === 0) {
      await interaction.reply({ content: `✅ **${user.tag}** has no warnings.`, ephemeral: true });

      const logChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("Grey")
          .setTitle("📋 **Warnings Checked**")
          .addFields(
            { name: "👤 **User**", value: `<@${user.id}> (${user.tag} • ${user.id})` },
            { name: "🛠️ **Moderator**", value: `<@${interaction.user.id}> (${interaction.user.tag} • ${interaction.user.id})` },
            { name: "📄 **Result**", value: "✅ No warnings found" },
            { name: "📅 **Date**", value: new Date().toLocaleString() }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "ROYAL SYNDICATE Logs" })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
      return;
    }

    // ✅ Warnings exist
    const warnList = warns[user.id]
      .map((warn, index) =>
        `**${index + 1}.** 📅 ${new Date(warn.date).toLocaleString()}\n` +
        `🛠️ By: **${warn.mod}**\n` +
        `📄 Reason: **${warn.reason}**`
      )
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(`⚠️ **Warnings for ${user.tag}**`)
      .setDescription(warnList)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "ROYAL SYNDICATE Moderation" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // 🔹 Log that warnings were checked
    const logChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("📋 **Warnings Checked**")
        .addFields(
          { name: "👤 **User**", value: `<@${user.id}> (${user.tag} • ${user.id})` },
          { name: "🛠️ **Moderator**", value: `<@${interaction.user.id}> (${interaction.user.tag} • ${interaction.user.id})` },
          { name: "⚠️ **Warnings Found**", value: `${warns[user.id].length}` },
          { name: "📅 **Date**", value: new Date().toLocaleString() }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Logs" })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  },
};
