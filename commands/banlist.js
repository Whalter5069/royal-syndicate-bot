const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1413508418962194544"; // Log channel ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banlist")
        .setDescription("📋 Show the list of banned users")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            const bans = await interaction.guild.bans.fetch();

            // 🟢 No bans case
            if (bans.size === 0) {
                await interaction.reply("✅ No users are banned in this server.");

                // Log empty ban list
                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle("📋 Ban List Checked")
                        .setDescription(`👤 ${interaction.user} (\`${interaction.user.id}\`) checked the ban list.`)
                        .addFields({ name: "📌 Result", value: "✅ No users are banned." })
                        .setFooter({ text: "🛡️ Moderation Logs" })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
                return;
            }

            // 🔴 Prepare ban list
            const banList = bans
                .map(b => `🚫 **${b.user.tag}** (\`${b.user.id}\`) — 📄 Reason: ${b.reason || "❌ No reason provided"}`)
                .join("\n");

            // 🔴 Ban list embed
            const embed = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("🚫 Ban List")
                .setDescription(
                    banList.length > 4000 
                        ? banList.slice(0, 4000) + "\n... (⚠️ too many bans to display)" 
                        : banList
                )
                .setFooter({ text: `📌 Total Bans: ${bans.size}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // 📝 Log to channel
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("DarkRed")
                    .setTitle("📋 Ban List Checked")
                    .setDescription(`👤 ${interaction.user} (\`${interaction.user.id}\`) used **/banlist**`)
                    .addFields({ name: "📌 Total Bans", value: `${bans.size}`, inline: true })
                    .setFooter({ text: "🛡️ Moderation Logs" })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (err) {
            console.error("❌ Error fetching ban list:", err);
            await interaction.reply({ content: "❌ Could not fetch ban list.", ephemeral: true });
        }
    },
};
