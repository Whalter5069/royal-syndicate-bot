const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const MUTE_LOG_CHANNEL_ID = "1413504616978438185"; // আলাদা mute-log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544"; // Main moderation log channel

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute (timeout) a user")
        .addUserOption(option =>
            option.setName("user").setDescription("User to mute").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("duration")
                .setDescription("Mute duration in minutes")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for mute")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const duration = interaction.options.getInteger("duration");
        const reason = interaction.options.getString("reason") || "No reason provided";

        try {
            const member = await interaction.guild.members.fetch(user.id);

            // duration in ms
            const muteMs = duration * 60 * 1000;
            await member.timeout(muteMs, reason);

            await interaction.reply({ content: `🔇 Muted ${user.tag} for ${duration} minutes. Reason: ${reason}`, ephemeral: true });

            // Common embed
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("🔇 Member Muted")
                .addFields(
                    { name: "👤 User", value: `${user.tag} (${user.id})` },
                    { name: "🛠️ Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: "⏳ Duration", value: `${duration} minute(s)` },
                    { name: "📄 Reason", value: reason },
                    { name: "📅 Date", value: new Date().toLocaleString() }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
                .setTimestamp();

            // ✅ Send log to dedicated mute-log channel
            const muteLogChannel = interaction.guild.channels.cache.get(MUTE_LOG_CHANNEL_ID);
            if (muteLogChannel) await muteLogChannel.send({ embeds: [embed] });

            // ✅ Send log to main moderation log channel
            const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (mainLogChannel) await mainLogChannel.send({ embeds: [embed] });

            // ✅ DM to muted user
            try {
                await user.send(`🔇 You have been muted in **${interaction.guild.name}** for **${duration} minutes**.\n📄 Reason: ${reason}`);
            } catch {
                console.log("❌ Could not send DM to user after mute.");
            }

        } catch (err) {
            console.error("Mute Error:", err);
            await interaction.reply({ content: "❌ I couldn’t mute that user.", ephemeral: true });
        }
    },
};
