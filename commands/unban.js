const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1413500123446771824"; // ✅ Fixed log channel for unban

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a user by ID")
        .addStringOption(option =>
            option.setName("userid").setDescription("The ID of the user to unban").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString("userid");

        try {
            await interaction.guild.members.unban(userId);

            // ✅ Reply only to moderator
            await interaction.reply({ content: `✅ Unbanned <@${userId}>`, ephemeral: true });

            // ✅ Send log embed to channel
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("♻️ Member Unbanned")
                    .addFields(
                        { name: "👤 User ID", value: userId, inline: false },
                        { name: "🛠️ Moderator", value: interaction.user.tag, inline: false },
                        { name: "📅 Date", value: new Date().toLocaleString(), inline: false }
                    )
                    .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error("❌ Unban error:", err);
            await interaction.reply({ content: "❌ Couldn’t unban that user.", ephemeral: true });
        }
    },
};
