const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const LOG_CHANNEL_ID = "1413508418962194544"; // Log Channel ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("📖 Shows all available commands"),

  async execute(interaction) {
    const isMod = interaction.member.permissions.has(PermissionFlagsBits.KickMembers);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    // 📌 Base Embed
    const helpEmbed = new EmbedBuilder()
      .setColor("#00ffcc")
      .setTitle("📖 **HELP MENU**")
      .setDescription("✨ Here are the available commands, categorized by roles:")
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    // 👥 Normal User Commands
    helpEmbed.addFields({
      name: "👥 **User Commands**",
      value: [
        "🔔 **/ping** → Check if the bot is alive",
        "🆔 **/userinfo** → Get user information",
        "🏰 **/serverinfo** → Get server information",
        "🖼️ **/avatar** → Show a user's avatar",
        "📜 **/situation** → Log a situation (RP logs)"
      ].join("\n")
    });

    // 🛡️ Moderator Commands
    if (isMod || isAdmin) {
      helpEmbed.addFields({
        name: "🛡️ **Moderator Commands**",
        value: [
          "📢 **/announce** → Make an announcement",
          "⛔ **/ban** → Ban a user",
          "👢 **/kick** → Kick a user",
          "🔇 **/mute** → Mute a user",
          "🔊 **/unmute** → Unmute a user",
          "⚠️ **/warn** → Warn a user",
          "📂 **/warnings** → Check a user's warnings",
          "📕 **/strike** → Give a strike to a user",
          "📊 **/strike-point** → Give strike points",
          "📤 **/discharge** → Discharge a member",
          "⬇️ **/demotion** → Demote a member",
          "⬆️ **/promotion** → Promote a member",
          "📝 **/punishment-task** → Assign punishment tasks"
        ].join("\n")
      });
    }

    // 👑 Admin-only Commands
    if (isAdmin) {
      helpEmbed.addFields({
        name: "👑 **Admin Commands**",
        value: [
          "♻️ **/resetwarn** → Reset warnings",
          "📋 **/banlist** → See all banned users"
        ].join("\n")
      });
    }

    // 📌 LOA Commands
    helpEmbed.addFields({
      name: "📌 **LOA System Commands**",
      value: [
        "🛌 **/loa-request** → Submit a leave request",
        "✅ **/end-loa** → End a member's leave"
      ].join("\n")
    });

    // ✅ Reply to user
    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

    // 📝 Log channel
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📖 **Help Command Used**")
        .setDescription(`👤 ${interaction.user} (\`${interaction.user.id}\`) used **/help**`)
        .addFields({
          name: "📋 **Visible Commands**",
          value: helpEmbed.data.fields.map(f => f.name).join(", ")
        })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
};
