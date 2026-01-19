const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const promotionMessages = [
  "🎉 Congratulations on your well-deserved promotion!",
  "🎖️ A new rank, a new responsibility — wear it with pride!",
  "💪 Your hard work has finally paid off, salute to you!",
  "⚔️ The Royal Syndicate grows stronger with your promotion.",
  "🏅 Respect the rank, lead with honor — congrats soldier!",
  "🔥 Another warrior rises higher on the battlefield.",
  "✨ Your dedication has earned you this new title.",
  "🚀 Promoted and powered up — the city better be ready!",
  "⚡ With great rank comes greater responsibility — good luck!",
  "👑 Your promotion is a victory for the whole Syndicate.",
  "🌟 From soldier to leader, your journey inspires us all.",
  "🛡️ Your loyalty and strength have brought you this honor.",
  "🎖️ New stripes, new glory — congratulations!",
  "🏰 The Royal Syndicate celebrates your achievement today.",
  "⚔️ Your grind and loyalty finally get recognition!",
  "🌌 Another star shines brighter in the Syndicate sky.",
  "🔥 This promotion proves your unstoppable spirit.",
  "⚔️ Step into your new role with pride and confidence.",
  "💎 Your rank has changed, but your fire remains the same.",
  "🚩 Rise higher, lead stronger — congratulations on your promotion!"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("promotion")
    .setDescription("🎖️ Promote a member to a higher role")
    .addUserOption(option =>
      option.setName("user").setDescription("👤 The user to promote").setRequired(true)
    )
    .addRoleOption(option =>
      option.setName("oldrole").setDescription("📌 User's current role (will NOT be removed)").setRequired(true)
    )
    .addRoleOption(option =>
      option.setName("newrole").setDescription("🏅 The new role to assign").setRequired(true)
    )
    .addStringOption(option => {
      option.setName("message").setDescription("📝 Select a promotion message (optional)").setRequired(false);
      promotionMessages.slice(0, 25).forEach(msg => {
        option.addChoices({ name: msg.slice(0, 100), value: msg });
      });
      return option;
    }),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.editReply({ content: "❌ You don't have permission to use this command." });
      }

      const user = interaction.options.getUser("user");
      const oldRole = interaction.options.getRole("oldrole");
      const newRole = interaction.options.getRole("newrole");
      const selectedMessage = interaction.options.getString("message");

      const member = await interaction.guild.members.fetch(user.id);

      // ✅ Add new role
      await member.roles.add(newRole);

      const finalMessage = selectedMessage || promotionMessages[Math.floor(Math.random() * promotionMessages.length)];

      // 🎖️ Promotion Embed
      const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("🏅 **Promotion Announcement**")
        .setDescription(
          `👑 **Dear ${user},**\n\nYou have been **promoted** by ${interaction.user} from **${oldRole}** ➝ **${newRole}**\n\n✨ **${finalMessage}**`
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 **User**", value: `${user.tag} (\`${user.id}\`)`, inline: false },
          { name: "🛠️ **Promoted By**", value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
          { name: "📅 **Date**", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setImage("https://media.discordapp.net/attachments/1328281349471342593/1461291979408412841/standard_4.gif")
        .setFooter({ 
        text: "👑Royal Syndicate Management", 
        iconURL: interaction.client.user.displayAvatarURL() // bot profile pic
    });

      // 📢 Send to fixed promotion channel
      if (process.env.PROMOTION_CHANNEL_ID) {
        const promoChannel = await interaction.guild.channels.fetch(process.env.PROMOTION_CHANNEL_ID).catch(() => null);
        if (promoChannel) await promoChannel.send({ content: `${user}`, embeds: [embed] });
      }

      // 📝 Also send to log channel
      if (process.env.LOG_CHANNEL_ID) {
        const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [embed] });
      }

      // ✅ Final response
      await interaction.editReply({ content: `✅ Successfully promoted **${user.tag}** to **${newRole}**!` });

    } catch (err) {
      console.error("❌ Error in /promotion:", err);
      if (interaction.deferred) {
        await interaction.editReply({ content: "❌ Failed to promote user." });
      } else {
        await interaction.reply({ content: "❌ Failed to promote user.", ephemeral: true });
      }
    }
  }
};
