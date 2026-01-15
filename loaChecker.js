const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const LOA_FILE = path.join(__dirname, "data/loas.json");

async function checkExpiredLOAs(client) {
  if (!fs.existsSync(LOA_FILE)) return;
  const loas = JSON.parse(fs.readFileSync(LOA_FILE));

  const now = Date.now();
  for (const [userId, loa] of Object.entries(loas)) {
    if (loa.status === "approved" && loa.end <= now) {
      // Expired LOA
      loa.status = "ended";

      const guild = client.guilds.cache.first();
      if (guild) {
        // Common Embed for LOA End
        const endEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("⏰ LOA ENDED")
          .setDescription(`<@${userId}>'s **Leave of Absence** has automatically ended.`)
          .addFields(
            { name: "👤 Member", value: `<@${userId}>`, inline: true },
            { name: "📝 Reason", value: loa.reason || "N/A", inline: false },
            { name: "⏳ Duration", value: loa.duration || "N/A", inline: true },
            { name: "📅 Ended At (BD)", value: loa.endTime || "N/A", inline: true }
          )
          .setFooter({ text: "⚔️ Royal Syndicate • Auto LOA System" })
          .setTimestamp();

        // ✅ Send to LOG_CHANNEL_ID
        if (process.env.LOG_CHANNEL_ID) {
          try {
            const logChannel = await guild.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) await logChannel.send({ embeds: [endEmbed] });
          } catch (e) {
            console.log("⚠️ Could not send to LOG_CHANNEL_ID:", e);
          }
        }

        // ✅ Send to FIXED_END_LOA_CHANNEL_ID
        if (process.env.FIXED_END_LOA_CHANNEL_ID) {
          try {
            const fixedLoaChannel = await guild.channels.fetch(process.env.FIXED_END_LOA_CHANNEL_ID).catch(() => null);
            if (fixedLoaChannel) await fixedLoaChannel.send({ embeds: [endEmbed] });
          } catch (e) {
            console.log("⚠️ Could not send to FIXED_END_LOA_CHANNEL_ID:", e);
          }
        }

        // ✅ Try DM to user
        guild.members.fetch(userId).then(member => {
          member.send({ embeds: [endEmbed] }).catch(() => {
            console.log(`⚠️ Could not DM user ${userId} about LOA end.`);
          });
        }).catch(() => {});
      }
    }
  }

  fs.writeFileSync(LOA_FILE, JSON.stringify(loas, null, 2));
}

function loaChecker(client) {
  console.log("⏳ LOA auto-checker started...");
  setInterval(() => checkExpiredLOAs(client), 30 * 1000); // প্রতি 30 সেকেন্ডে চেক করবে
}

module.exports = { loaChecker };
