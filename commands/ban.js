const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1413508418962194544"; // তোমার log channel ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from the server")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User to ban")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for ban")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "No reason provided";

        // Fetch member from guild
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: "❌ Member not found in this server.", ephemeral: true });
        }

        // Check bannable
        if (!member.bannable) {
            return interaction.reply({ content: "❌ I cannot ban this user (higher role?).", ephemeral: true });
        }

        try {
            await member.ban({ reason });
            await interaction.reply({ content: `✅ Banned **${user.tag}** for: **${reason}**`, ephemeral: true });

            // Send to log channel
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("DarkRed")
                    .setTitle("🔨 Member Banned")
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: "👤 User", value: `${user.tag} (\`${user.id}\`)`, inline: false },
                        { name: "🛠️ Moderator", value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
                        { name: "📄 Reason", value: reason, inline: false }
                    )
                    .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error("❌ Ban error:", err);
            await interaction.reply({ content: "❌ Failed to ban this user. Check bot permissions & role hierarchy.", ephemeral: true });
        }
    },
};
