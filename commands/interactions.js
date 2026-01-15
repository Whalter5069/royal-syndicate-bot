const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Replace with your log channel ID
const LOG_CHANNEL_ID = "1441891775823478824";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("interactions")
    .setDescription("📒 Log an interaction with a member")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("👤 Member you interacted with")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("details")
        .setDescription("📝 Custom details text after the first bold line")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser("user"); // Member you interacted with
      const details = interaction.options.getString("details");

      await interaction.reply({ 
        content: `⏳ Logging interaction with **${target.tag}**...`, 
        ephemeral: true 
      });

      // Fetch your server member to get nickname
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

      // Embed with first line bold + multi-line details
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📒 INTERACTION LOG")
        .addFields(
          { 
            name: "🧾", 
            value: `Logged By\n${member ? `@${member.displayName}` : interaction.user.username}`, 
            inline: false 
          },
          { 
            name: "📝", 
            value: `Details\n**<@${target.id}>**\n${details}`, 
            inline: false 
          }
        )
        .setFooter({ 
          text: "👑 Royal Syndicate Management", 
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      // Fetch the log channel
      const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (!logChannel) return interaction.editReply({ content: "⚠️ Log channel not found!" });

      // Send the embed (mention inside embed + multi-line)
      await logChannel.send({ embeds: [embed] });

      await interaction.editReply({ 
        content: `✅ Interaction with **${target.tag}** logged successfully in <#${LOG_CHANNEL_ID}>.` 
      });

    } catch (err) {
      console.error("❌ Error in /interactions:", err);
      await interaction.editReply({ content: "⚠️ Failed to log interaction." });
    }
  }
};
