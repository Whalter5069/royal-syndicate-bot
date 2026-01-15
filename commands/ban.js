const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// Config
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const BAN_CHANNEL_ID = process.env.BAN_CHANNEL_ID;
const tempBansPath = path.join(__dirname, "../data/tempBans.json");

// Ensure JSON exists
if (!fs.existsSync(tempBansPath)) fs.writeFileSync(tempBansPath, JSON.stringify([]));

function saveTempBan(banData) {
  const bans = JSON.parse(fs.readFileSync(tempBansPath));
  bans.push(banData);
  fs.writeFileSync(tempBansPath, JSON.stringify(bans, null, 2));
}

// Predefined ban messages
const banMessages = [
  "🚫 You have been banned from **ROYAL SYNDICATE**.",
  "🔨 Justice has spoken! You are banned.",
  "❌ You violated the rules. Ban applied.",
  "📛 Access revoked. You are now banned.",
  "⚠️ Your journey in this server ends here. You are banned.",
  "🚷 Rule-breaking detected. Ban executed.",
  "💀 Banned! Actions have consequences."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption(option =>
      option.setName("user").setDescription("User to ban").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("length")
        .setDescription("Number for ban duration (e.g. 5)")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("duration")
        .setDescription("Type of ban duration")
        .setRequired(true)
        .addChoices(
          { name: "Minutes", value: "minutes" },
          { name: "Hours", value: "hours" },
          { name: "Days", value: "days" },
          { name: "Weeks", value: "weeks" },
          { name: "Months", value: "months" },
          { name: "Years", value: "years" },
          { name: "Permanent", value: "permanent" }
        )
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for ban").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const length = interaction.options.getInteger("length");
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ Member not found in this server.", ephemeral: true });
    }
    if (!member.bannable) {
      return interaction.reply({ content: "⚠️ I cannot ban this user (role hierarchy issue).", ephemeral: true });
    }

    // Step 1: Ask which ban message to send
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("banMessageSelect")
        .setPlaceholder("Select a ban message or choose Custom")
        .addOptions([
          ...banMessages.map((msg, i) => ({ label: `Message ${i + 1}`, value: `msg_${i}` })),
          { label: "✍️ Custom Message", value: "custom" }
        ])
    );

    await interaction.reply({
      content: `⚖️ Select a ban message for **${user.tag}**:`,
      components: [row],
      ephemeral: true
    });

    // Step 2: Collector for menu
    const menuCollector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId === "banMessageSelect",
      time: 60_000,
      max: 1
    });

    menuCollector.on("collect", async i => {
      let finalMessage = "";

      if (i.values[0] === "custom") {
        // Open modal for custom message
        const modal = new ModalBuilder()
          .setCustomId("customBanMsg")
          .setTitle("Custom Ban Message");

        const input = new TextInputBuilder()
          .setCustomId("customMsgInput")
          .setLabel("Enter custom ban message")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await i.showModal(modal);

        const submitted = await i.awaitModalSubmit({
          filter: m => m.customId === "customBanMsg" && m.user.id === interaction.user.id,
          time: 120_000
        }).catch(() => null);

        if (!submitted) return;

        finalMessage = submitted.fields.getTextInputValue("customMsgInput");
        await submitted.reply({ content: "✅ Custom ban message set.", ephemeral: true });
      } else {
        const index = parseInt(i.values[0].split("_")[1], 10);
        finalMessage = banMessages[index];
        await i.reply({ content: `✅ Selected ban message: "${finalMessage}"`, ephemeral: true });
      }

      // Calculate ban duration
      let banLength;
      let unbanAt = null;

      if (duration === "permanent") {
        banLength = "Permanent";
      } else {
        banLength = `${length} ${duration}`;
        let ms = 0;
        if (duration === "minutes") ms = length * 60 * 1000;
        if (duration === "hours") ms = length * 60 * 60 * 1000;
        if (duration === "days") ms = length * 24 * 60 * 60 * 1000;
        if (duration === "weeks") ms = length * 7 * 24 * 60 * 60 * 1000;
        if (duration === "months") ms = length * 30 * 24 * 60 * 60 * 1000;
        if (duration === "years") ms = length * 365 * 24 * 60 * 60 * 1000;
        unbanAt = Date.now() + ms;

        // Save temporary ban
        saveTempBan({
          guildId: interaction.guild.id,
          userId: user.id,
          banLength,
          reason,
          unbanAt
        });
      }

      // Build DM embed
      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle("⛔ You Have Been Banned")
        .setDescription(finalMessage)
        .addFields(
          { name: "👤 Member", value: `${user} (\`${user.id}\`)` },
          { name: "📌 Reason", value: reason },
          { name: "⏳ Ban Length", value: banLength },
          { name: "🔨 Banned By", value: `${interaction.user} (\`${interaction.user.id}\`)` }
        )
        .setFooter({ text: "ROYAL SYNDICATE Moderation Logs", iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      // Try sending DM first
      try {
        await user.send({ embeds: [dmEmbed] });
      } catch {
        console.log("⚠️ Could not DM the user before ban.");
      }

      // Ban the user
      await member.ban({ reason });

      await interaction.followUp({ content: `✅ Banned **${user.tag}** for: **${banLength}**`, ephemeral: true });

      // Logs
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      const banChannel = interaction.guild.channels.cache.get(BAN_CHANNEL_ID);

      if (logChannel) await logChannel.send({ embeds: [dmEmbed] });
      if (banChannel) await banChannel.send({ content: `${user}`, embeds: [dmEmbed] });
    });
  }
};
