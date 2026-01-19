const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const DISCHARGE_CHANNEL_ID = process.env.DISCHARGE_CHANNEL_ID;
const DISCHARGED_ROLE_ID = process.env.DISCHARGED_ROLE_ID;

// কিছু sample farewell messages
const farewellMessages = [
  "📜 **Thanks for your valuable time and best wishes for the future.**",
  "🫡 **Farewell soldier, may success follow you always.**",
  "🤝 **We appreciate your contribution to the Syndicate.**",
  "🌅 **Every ending is a new beginning — good luck ahead!**",
  "⚜️ **You will always be remembered as part of the team.**"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("discharge")
    .setDescription("📜 **Officially discharge a member from Royal Syndicate**")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName("user").setDescription("👤 **The member to discharge**").setRequired(true))
    .addStringOption(opt =>
      opt.setName("reason").setDescription("✍️ **Reason for discharge**").setRequired(true))
    .addStringOption(option => {
      option.setName("message")
        .setDescription("💬 **Select or write a farewell message (optional)**")
        .setRequired(false);

      farewellMessages.slice(0, 25).forEach(msg => {
        option.addChoices({ name: msg.slice(0, 100), value: msg });
      });

      return option;
    }),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const customMessage = interaction.options.getString("message");
      const member = await interaction.guild.members.fetch(targetUser.id);

      // পুরনো role গুলো save
      const oldRoles = member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .map(r => `<@&${r.id}>`);

      // সব role remove করে discharged role add
      await member.roles.set([]);
      await new Promise(res => setTimeout(res, 1000));
      if (DISCHARGED_ROLE_ID) {
        await member.roles.add(DISCHARGED_ROLE_ID);
      }

      // Use custom or fallback message
      const farewell = customMessage || farewellMessages[Math.floor(Math.random() * farewellMessages.length)];

      // 📢 Public Discharge Embed
      const publicEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("📜 **OFFICIAL DISCHARGE NOTICE**")
        .setDescription(
          `⚔️ **You have been officially discharged from ${interaction.guild.name}**\n\n` +
          `${farewell}`
        )
        .addFields(
          { name: "👤 **Member**", value: `${targetUser}`, inline: false },
          { name: "✍️ **Reason**", value: `**${reason}**`, inline: false },
          { name: "🛡️ **Discharged By**", value: `${interaction.user}`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setImage("https://media.discordapp.net/attachments/1328281349471342593/1461291979408412841/standard_4.gif")
        .setFooter({ 
        text: "👑Royal Syndicate Management", 
        iconURL: interaction.client.user.displayAvatarURL() // bot profile pic
    })

      if (DISCHARGE_CHANNEL_ID) {
        const dischargeChannel = await interaction.guild.channels.fetch(DISCHARGE_CHANNEL_ID).catch(() => null);
        if (dischargeChannel) {
          await dischargeChannel.send({ content: `${targetUser}`, embeds: [publicEmbed] });
        }
      }

      // 📝 Log Embed
      if (LOG_CHANNEL_ID) {
        const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📘 **Discharge Logged**")
            .addFields(
              { name: "👤 **Discharged Member**", value: `${targetUser} (\`${targetUser.id}\`)`, inline: false },
              { name: "✍️ **Reason**", value: `**${reason}**`, inline: false },
              { name: "🛡️ **Discharged By**", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
              { name: "🗑️ **Removed Roles**", value: oldRoles.length > 0 ? oldRoles.join(", ") : "**None**", inline: false },
              { name: "🎖️ **New Role**", value: `<@&${DISCHARGED_ROLE_ID}>`, inline: false }
            )
            .setFooter({ text: "⚜️ Discharge Log ⚜️", iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      await interaction.editReply(`✅ **Discharge completed for ${targetUser.tag}**`);
    } catch (err) {
      console.error("❌ Error in /discharge:", err);
      await interaction.editReply("⚠️ **Failed to discharge member.**");
    }
  }
};
