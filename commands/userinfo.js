const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Main log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Shows info about a user")
        .addUserOption(option =>
            option.setName("target").setDescription("Select a user").setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("target") || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        // Main reply embed
        const infoEmbed = new EmbedBuilder()
            .setColor("#00ffcc")
            .setTitle(`👤 User Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "ID", value: user.id, inline: true },
                { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed] });

        // ✅ Log embed
        const logEmbed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("👁️ Userinfo Viewed")
            .addFields(
                { name: "👤 Target User", value: `${user.tag} (${user.id})` },
                { name: "🕵️ Viewed By", value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: "📅 Date", value: new Date().toLocaleString() }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "ROYAL SYNDICATE Logs" })
            .setTimestamp();

        const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
        if (mainLogChannel) {
            await mainLogChannel.send({ embeds: [logEmbed] });
        }
    },
};
