const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const UNMUTE_LOG_CHANNEL_ID = "1413504907037638727"; // unmute-log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";   // Main moderation log channel

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Unmute (remove timeout) a user")
        .addUserOption(option =>
            option.setName("user").setDescription("User to unmute").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("user");

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(null); // remove timeout

            await interaction.reply({ content: `🔊 Unmuted <@${user.id}>`, ephemeral: true });

            // Common embed for both logs
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("🔊 Member Unmuted")
                .addFields(
                    { name: "👤 User", value: `<@${user.id}> (${user.tag} • ${user.id})` },
                    { name: "🛠️ Moderator", value: `<@${interaction.user.id}> (${interaction.user.tag})` },
                    { name: "📅 Date", value: new Date().toLocaleString() }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "ROYAL SYNDICATE Moderation Logs" })
                .setTimestamp();

            // ✅ Send log to dedicated unmute log channel
            const unmuteLogChannel = interaction.guild.channels.cache.get(UNMUTE_LOG_CHANNEL_ID);
            if (unmuteLogChannel) {
                await unmuteLogChannel.send({ embeds: [embed] });
            }

            // ✅ Send log to main moderation log channel
            const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (mainLogChannel) {
                await mainLogChannel.send({ embeds: [embed] });
            }

            // ✅ DM to unmuted user
            try {
                await user.send(`🔊 You have been unmuted in **${interaction.guild.name}**.`);
            } catch {
                console.log("❌ Could not send DM to user after unmute.");
            }
        } catch (err) {
            console.error("Unmute Error:", err);
            await interaction.reply({ content: "❌ I couldn’t unmute that user.", ephemeral: true });
        }
    },
};
