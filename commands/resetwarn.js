const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const warns = require("../data/warns.json");

// 📢 Dedicated clearwarnings log channel
const CLEARWARN_LOG_CHANNEL_ID = "1413491274501062736";

// 📢 Main moderation log channel
const MAIN_LOG_CHANNEL_ID = "1413508418962194544";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clearwarnings")
        .setDescription("⚠️ Clear warnings of a user")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("👤 User to clear warnings")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("🔢 How many warnings to clear (leave empty for all)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("📄 Clear warnings by reason (exact match)")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");
            const reasonFilter = interaction.options.getString("reason");

            if (!warns[user.id] || warns[user.id].length === 0) {
                return interaction.editReply(`✅ **${user.tag}** has no warnings to clear.`);
            }

            let cleared = [];

            if (reasonFilter) {
                // 🔎 Filter by reason
                warns[user.id] = warns[user.id].filter(w => {
                    if (w.reason.toLowerCase() === reasonFilter.toLowerCase()) {
                        cleared.push(w);
                        return false;
                    }
                    return true;
                });

                if (cleared.length === 0) {
                    return interaction.editReply(`❌ No warnings with reason \`${reasonFilter}\` found for **${user.tag}**.`);
                }

                if (warns[user.id].length === 0) delete warns[user.id];

            } else if (!amount || amount >= warns[user.id].length) {
                cleared = warns[user.id];
                delete warns[user.id];
            } else {
                cleared = warns[user.id].splice(0, amount);
            }

            fs.writeFileSync("./data/warns.json", JSON.stringify(warns, null, 2));

            // 📑 Embed
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ **Warnings Cleared**")
                .setDescription(`🗑️ Cleared **${cleared.length}** warning(s) for **${user.tag}**.`)
                .addFields(
                    { name: "👤 **User**", value: `${user.tag} (\`${user.id}\`)`, inline: false },
                    { name: "🛠️ **Moderator**", value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
                    { name: "📄 **Warnings Cleared**", value: cleared.map((w, i) => `\`${i + 1}\` • ${w.reason} (by ${w.mod})`).join("\n") }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `⚖️ Remaining warnings: ${warns[user.id] ? warns[user.id].length : 0}` })
                .setTimestamp();

            // ✅ Confirm
            await interaction.editReply(`✅ Cleared **${cleared.length}** warning(s) for **${user.tag}**.`);

            // 📢 Log to clearwarnings channel
            const clearwarnChannel = interaction.guild.channels.cache.get(CLEARWARN_LOG_CHANNEL_ID);
            if (clearwarnChannel) await clearwarnChannel.send({ embeds: [embed] });

            // 📢 Log to main moderation log channel
            const mainLogChannel = interaction.guild.channels.cache.get(MAIN_LOG_CHANNEL_ID);
            if (mainLogChannel) await mainLogChannel.send({ embeds: [embed] });

        } catch (err) {
            console.error("❌ Error in /clearwarnings:", err);
            if (!interaction.replied) {
                await interaction.reply({ content: "❌ Something went wrong while clearing warnings.", ephemeral: true });
            }
        }
    },
};
