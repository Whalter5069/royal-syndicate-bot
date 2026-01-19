const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("📢 Send an announcement (normal or embed)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName("type")
                .setDescription("📌 Announcement type")
                .addChoices(
                    { name: "📝 Normal", value: "normal" },
                    { name: "📑 Embed", value: "embed" }
                )
                .setRequired(true))
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("🗂️ Where to send the announcement?")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("💬 The announcement message (use \\n for new lines)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("images")
                .setDescription("🖼️ Image links (comma or newline separated)")
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName("file1")
                .setDescription("📂 Upload an image/file")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("mention")
                .setDescription("🔔 Optional mention (@here, @everyone, or <@&roleId>)")
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const type = interaction.options.getString("type");
            const channel = interaction.options.getChannel("channel");
            let message = interaction.options.getString("message") || "";
            const mention = interaction.options.getString("mention") || "";
            const file = interaction.options.getAttachment("file1");
            const imagesInput = interaction.options.getString("images") || "";

            // ✨ Support \n line breaks
            message = message.replace(/\\n/g, "\n").trim();

            // 🖼️ Collect images
            const imageLinks = imagesInput
                .split(/[\n,]+/)
                .map(x => x.trim())
                .filter(x => x.startsWith("http"));

            if (file?.url) {
                imageLinks.unshift(file.url);
            }

            // 📝 Normal message
            if (type === "normal") {
                let content = `${message}`;
                if (mention) content += `\n\n${mention}`;
                if (imageLinks.length > 0) {
                    content += `\n\n${imageLinks.join("\n")}`;
                }
                await channel.send(content);
            }

            // 📑 Embed message
            else if (type === "embed") {
                const embeds = [];

                const mainEmbed = new EmbedBuilder()
                    .setColor("#ffcc00")
                    .setTitle("📢 Announcement")
                    .setDescription(message.slice(0, 4096)) // prevent crash
                    .setImage("https://media.discordapp.net/attachments/1328281349471342593/1461291979408412841/standard_4.gif")
                    .setFooter({
                        text: "👑 ROYAL SYNDICATE Family",
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                if (imageLinks.length > 0) mainEmbed.setImage(imageLinks[0]);
                embeds.push(mainEmbed);

                for (let i = 1; i < imageLinks.length; i++) {
                    embeds.push(new EmbedBuilder().setColor("#ffcc00").setImage(imageLinks[i]));
                }

                await channel.send({ content: mention || null, embeds });
            }

            await interaction.editReply("✅ Announcement sent!");

            // 📜 Log Section
            if (LOG_CHANNEL_ID) {
                const logChannel = await interaction.guild.channels
                    .fetch(LOG_CHANNEL_ID)
                    .catch(() => null);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("📝 Announcement Logged")
                        .addFields(
                            { name: "👤 By", value: `${interaction.user} (\`${interaction.user.id}\`)` },
                            { name: "📺 Channel", value: `${channel} (\`${channel.id}\`)` },
                            { 
                                name: "💬 Message", 
                                value: message.length > 1024 
                                    ? message.slice(0, 1021) + "..." 
                                    : message || "None" 
                            },
                            { 
                                name: "🖼️ Images", 
                                value: imageLinks.length > 0 
                                    ? (imageLinks.join("\n").slice(0, 1024)) 
                                    : "None" 
                            },
                            { name: "🔔 Mention", value: mention || "None" },
                            { name: "📌 Type", value: type }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.warn("⚠️ Log channel not found, check LOG_CHANNEL_ID");
                }
            }

        } catch (err) {
            console.error("❌ Error in /announce:", err);
            await interaction.editReply("⚠️ Failed to send announcement.");
        }
    }
};
