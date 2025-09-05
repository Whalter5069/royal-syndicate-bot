const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const LOG_CHANNEL_ID = "1413508418962194544"; // 🔔  Log Channel ID 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows all available commands"),

    async execute(interaction) {
        const isMod = interaction.member.permissions.has(PermissionFlagsBits.KickMembers);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        // Base embed
        const helpEmbed = new EmbedBuilder()
            .setColor("#00ffcc")
            .setTitle("📜 Help Menu")
            .setDescription("Here are the available commands:")
            .setTimestamp();

        // ✅ Normal User commands
        helpEmbed.addFields(
            { name: "/ping", value: "Check if the bot is alive" },
            { name: "/userinfo", value: "Get user information" },
            { name: "/serverinfo", value: "Get server information" },
            { name: "/avatar", value: "Show a user’s avatar" }
        );

        // 🛡️ Mod-only commands
        if (isMod || isAdmin) {
            helpEmbed.addFields(
                { name: "/announce", value: "Make an announcement (Mod only)" },
                { name: "/ban", value: "Ban a user (Mod only)" },
                { name: "/kick", value: "Kick a user (Mod only)" },
                { name: "/warn", value: "Warn a user (Mod only)" },
                { name: "/warnings", value: "Check a user’s warnings" }
            );
        }

        // 👑 Admin-only commands
        if (isAdmin) {
            helpEmbed.addFields(
                { name: "/resetwarn", value: "Reset warnings (Admin only)" },
                { name: "/banlist", value: "See all banned users (Admin only)" }
            );
        }

        // Reply to user
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

        // 🔔 Send to log channel
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("📜 Help Command Used")
                .setDescription(`${interaction.user} (\`${interaction.user.id}\`) used **/help**`)
                .addFields(
                    { name: "Visible Commands", value: helpEmbed.data.fields.map(f => f.name).join(", ") }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    },
};
