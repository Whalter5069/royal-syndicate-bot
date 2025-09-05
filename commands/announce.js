const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Send an announcement to a specific channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // permission requirement
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Which channel to send the announcement to?")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("The announcement message (use \\n for new lines)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("mention")
                .setDescription("Optional mention (@here, @everyone or <@&roleId>)")
                .setRequired(false)),

    async execute(interaction) {
        // --- Role restriction ---
        const allowedRoles = process.env.MOD_ROLE_IDS?.split(",") || []; // .env এ MOD_ROLE_IDS=123,456,789
        const memberRoles = interaction.member.roles.cache.map(r => r.id);

        const hasRole = memberRoles.some(r => allowedRoles.includes(r));
        if (!hasRole) {
            return interaction.reply({
                content: "❌ You don’t have permission to use this command!",
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel("channel");
        let message = interaction.options.getString("message");
        const mention = interaction.options.getString("mention") || "";

        // Replace \n with actual new lines
        message = message.replace(/\\n/g, "\n");

        const embed = new EmbedBuilder()
            .setColor("#00ff00") 
            .setTitle("📢 Announcement")
            .setDescription(message)
            .setFooter({ text: "ROYAL SYNDICATE Family", iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        try {
            // ✅ Send announcement
            await channel.send({ embeds: [embed] });
            if (mention) {
                await channel.send(mention);
            }

            await interaction.reply({ content: "✅ Announcement sent with embed!", ephemeral: true });

            // ✅ Send log
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("📢 Announcement Logged")
                    .addFields(
                        { name: "👤 Announced By", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                        { name: "📺 Channel", value: `${channel} (\`${channel.id}\`)`, inline: false },
                        { name: "📄 Message", value: message, inline: false },
                        { name: "🔔 Mention", value: mention || "None", inline: false }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            console.error("❌ Error sending announcement:", err);
            await interaction.reply({ content: "❌ Failed to send announcement!", ephemeral: true });
        }
    }
};
