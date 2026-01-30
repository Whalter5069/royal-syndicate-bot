const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

/* ================= ENV ================= */
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const DISCHARGE_CHANNEL_ID = process.env.DISCHARGE_CHANNEL_ID;
const DISCHARGED_ROLE_ID = process.env.DISCHARGED_ROLE_ID;
const MEMBER_CHART_CHANNEL_ID = process.env.MEMBER_CHART_CHANNEL_ID;

/* ================= DATA FILE ================= */
const dataFolder = path.join(__dirname, "..", "data");
const jsonPath = path.join(dataFolder, "royalGang.json");

/* ================= EMOJI & ID ================ */
// ⚠️ এগুলা অবশ্যই তোমার server অনুযায়ী ঠিক করে দিও
/* ================= EMOJI ================= */
const emoji = {
 arrow: "<a:arrowred1:1466834714571571438>",
  alert1: "<a:alert1:1461251547626340374>",
  redcrownfire: "<a:redcrownfire:1466837802497868053>",
  pinkquartz: "<a:pinkquartz:1466683409341616200>",
  diablo: "<a:diablo:1466750063295332405>",
  flashingskull: "<a:flashingskull:1466683188448329780>",
  teammythril: "<a:teammythril:1466837352704905491>",
  worldcollector: "<a:worldcollector:1466749137188950138>",
  recruitrank: "<a:recruitrank:1466748293513084971>",
 divider2: "<a:divider2:1466849401896042598>",
divider1: "<a:divider1:1466849437979770973>",
  bluesiren: "<a:bluesiren:1461260430356905984>"
};

/* ================= ROLE ===================*/
const roles = {
  gangAccess: "1414558828426694707",
  khomota: "958217460039970883"
};

/* ================= FAREWELL MESSAGES ================= */
const farewellMessages = [
  "📜 **Thanks for your valuable time and best wishes for the future.**",
  "🫡 **Farewell soldier, may success follow you always.**",
  "🤝 **We appreciate your contribution to the Syndicate.**",
  "🌅 **Every ending is a new beginning — good luck ahead!**",
  "⚜️ **You will always be remembered as part of the team.**"
];

/* ================= JSON HELPERS ================= */
function ensureJSON() {
  if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);
  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(
      jsonPath,
      JSON.stringify({
        recruit: [],
        firstDivision: [],
        secondDivision: [],
        thirdDivision: [],
        highCommand: [],
        coLeader: [],
        Mafia: []
      }, null, 2)
    );
  }
}

function loadGang() {
  ensureJSON();
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function saveGang(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
}

function removeFromGang(userId, gang) {
  for (const rank in gang) {
    gang[rank] = gang[rank].filter(id => id !== userId);
  }
}

/* ================= MEMBER CHART EMBED ================= */
function formatGangEmbed(gang, client) {
  const format = arr =>
    arr.length ? arr.map(id => `${emoji.arrow} <@${id}>`).join("\n") : "_None_";

  return new EmbedBuilder()
    .setColor("White")
    .setTitle(`${emoji.alert1} THE OFFICIAL MEMBERS OF ROYAL SYNDICATE ${emoji.alert1}`)
    .setDescription(`
${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}${emoji.divider1}
${emoji.redcrownfire} **Mafia**
${format(gang.Mafia)}

${emoji.pinkquartz} **Co-Leader**
${format(gang.coLeader)}

${emoji.diablo} **High-Command**
${format(gang.highCommand)}

${emoji.flashingskull} **Third Devision**
${format(gang.thirdDivision)}

${emoji.teammythril} **Second Devision**
${format(gang.secondDivision)}

${emoji.worldcollector} **First Devision**
${format(gang.firstDivision)}

${emoji.recruitrank} **Recruit**
${format(gang.recruit)}

${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}${emoji.divider2}
<@&${roles.gangAccess}>   <@&${roles.khomota}>
`)
    .setImage("https://cdn.discordapp.com/attachments/1328281349471342593/1466672070573162567/IMG_3279.png")
    .setFooter({
      text: "👑Royal Syndicate Management",
      iconURL: client.user.displayAvatarURL()
    });
}

/* ================= SLASH COMMAND ================= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("discharge")
    .setDescription("📜 Officially discharge a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(true))
    .addStringOption(o =>
      o.setName("message").setDescription("Farewell message (optional)")
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const customMessage = interaction.options.getString("message");
      const member = await interaction.guild.members.fetch(user.id);

      /* ===== REMOVE FROM GANG JSON ===== */
      const gang = loadGang();
      removeFromGang(user.id, gang);
      saveGang(gang);

      /* ===== REMOVE ROLES ===== */
      const oldRoles = member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .map(r => `<@&${r.id}>`);

      await member.roles.set([]);
      if (DISCHARGED_ROLE_ID) await member.roles.add(DISCHARGED_ROLE_ID);

      /* ===== PUBLIC EMBED ===== */
      const farewell =
        customMessage ||
        farewellMessages[Math.floor(Math.random() * farewellMessages.length)];

      const publicEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("📜 OFFICIAL DISCHARGE NOTICE")
        .setDescription(`${farewell}`)
        .addFields(
          { name: "👤 Member", value: `${user}` },
          { name: "✍️ Reason", value: reason },
          { name: "🛡️ Discharged By", value: `${interaction.user}` }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setImage("https://media.discordapp.net/attachments/1328281349471342593/1461291979408412841/standard_4.gif")
        .setFooter({
          text: "👑Royal Syndicate Management",
          iconURL: interaction.client.user.displayAvatarURL()
        });

      if (DISCHARGE_CHANNEL_ID) {
        const ch = await interaction.guild.channels.fetch(DISCHARGE_CHANNEL_ID).catch(() => null);
        ch && ch.send({ content: `${user}`, embeds: [publicEmbed] });
      }

      /* ===== LOG ===== */
      if (LOG_CHANNEL_ID) {
        const logCh = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logCh) {
          const logEmbed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📘 Discharge Logged")
            .addFields(
              { name: "Member", value: `${user} (${user.id})` },
              { name: "Reason", value: reason },
              { name: "Removed Roles", value: oldRoles.join(", ") || "None" }
            )
            .setTimestamp();
          await logCh.send({ embeds: [logEmbed] });
        }
      }

      /* ===== UPDATE MEMBER CHART ===== */
      if (MEMBER_CHART_CHANNEL_ID) {
        const chartCh = await interaction.guild.channels
          .fetch(MEMBER_CHART_CHANNEL_ID)
          .catch(() => null);

        if (chartCh) {
          const msgs = await chartCh.messages.fetch({ limit: 10 });
          msgs
            .filter(m => m.author.id === interaction.client.user.id)
            .forEach(m => m.delete().catch(() => {}));

          await chartCh.send({
            embeds: [formatGangEmbed(gang, interaction.client)],
            allowedMentions: {
              roles: [roles.gangAccess, roles.khomota]
            }
          });
        }
      }

      await interaction.editReply(`✅ **${user.tag} discharged successfully**`);
    } catch (err) {
      console.error("❌ Discharge error:", err);
      await interaction.editReply("⚠️ Failed to discharge member.");
    }
  }
};
