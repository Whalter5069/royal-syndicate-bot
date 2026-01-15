const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// 📢 Main log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("🌍 Shows detailed info about the server"),

    async execute(interaction) {
        const { guild } = interaction;

        // 📑 Server info embed
        const embed = new EmbedBuilder()
            .setColor("#00ccff")
            .setTitle(`🌍 **Server Info: ${guild.name}**`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: "🆔 **Server ID**", value: `\`${guild.id}\``, inline: true },
                { name: "👑 **Owner**", value: `<@${guild.ownerId}>`, inline: true },
                { name: "👥 **Members**", value: `**${guild.memberCount}**`, inline: true },
                { name: "📅 **Created**", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ 
        text: "👑Royal Syndicate Management", 
        iconURL: interaction.client.user.displayAvatarURL() // bot profile pic
    })

        await interaction.reply({ embeds: [embed] });

        // 📢 Log who used the command
        try {
            const logChannel = guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("📜 **Command Used**")
                    .setDescription(`🔍 **/serverinfo** command was executed.`)
                    .addFields(
                        { name: "👤 **User**", value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
                        { name: "📅 **Date**", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setFooter({ text: "⚡ ROYAL SYNDICATE Command Logs" })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            console.error("❌ Error sending serverinfo log:", err);
        }
    },
};
