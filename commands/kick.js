const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

// আলাদা kick-log channel (optional)
const KICK_LOG_CHANNEL_ID = "1413499632675454988";

// Main moderation log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the server")
        .addUserOption(option =>
            option.setName("user").setDescription("User to kick").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for kick").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "No reason provided";

        try {
            const member = await interaction.guild.members.fetch(user.id);

            // ✅ First try to DM user
            try {
                await user.send(
                    `🔨 You have been **kicked** from **${interaction.guild.name}**.\n\n📄 Reason: ${reason}\n🛠️ Moderator: ${interaction.user.tag}`
                );
            } catch (dmError) {
                console.log("❌ Could not send DM to user:", dmError);
            }

            // ✅ Kick after DM
            await member.kick(reason);

            // ✅ Reply to moderator
            await interaction.reply({ content: `✅ Kicked ${user.tag} for: ${reason}`, ephemeral: true });

            // Common embed
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("🔨 Member Kicked")
                .addFields(
                    { name: "👤 User", value: `${user.tag} (${user.id})` },
                    { name: "🛠️ Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: "📄 Reason", value: reason },
                    { name: "📅 Date", value: new Date().toLocaleString() }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
                .setTimestamp();

            // ✅ Send log to fixed kick-log channel
            const kickLogChannel = interaction.guild.channels.cache.get(KICK_LOG_CHANNEL_ID);
            if (kickLogChannel) await kickLogChannel.send({ embeds: [embed] });

            // ✅ Send log to main moderation log channel
            const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (mainLogChannel) await mainLogChannel.send({ embeds: [embed] });

        } catch (err) {
            console.error("❌ Kick Error:", err);
            await interaction.reply({ content: "❌ I couldn’t kick that user.", ephemeral: true });
        }
    },
};
