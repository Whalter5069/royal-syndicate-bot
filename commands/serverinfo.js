const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Main log channel ID ( main )
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Shows info about the server"),

    async execute(interaction) {
        const { guild } = interaction;

        const embed = new EmbedBuilder()
            .setColor("#00ccff")
            .setTitle(`🌍 Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: "Server ID", value: guild.id, inline: true },
                { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
                { name: "Members", value: `${guild.memberCount}`, inline: true },
                { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: "ROYAL SYNDICATE Bot" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // ✅ Log who used the command
        try {
            const logChannel = guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("📜 Command Used")
                    .setDescription(`🔍 **/serverinfo** command was used`)
                    .addFields(
                        { name: "👤 User", value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: "📅 Date", value: new Date().toLocaleString() }
                    )
                    .setFooter({ text: "ROYAL SYNDICATE Command Logs" })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            console.error("❌ Error sending serverinfo log:", err);
        }
    },
};
