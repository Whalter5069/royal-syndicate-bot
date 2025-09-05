const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const MAIN_LOG_CHANNEL_ID = "1413508418962194544"; // তোমার main log channel ID বসাও

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    async execute(interaction) {
        // Normal reply
        await interaction.reply("🏓 Pong!");

        // Build log embed
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🏓 Ping Command Used")
            .setDescription(`Ping command executed by <@${interaction.user.id}>`)
            .addFields(
                { name: "👤 User", value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: "📅 Date", value: new Date().toLocaleString() }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "ROYAL SYNDICATE Logs" })
            .setTimestamp();

        // Send log
        const logChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    },
};
