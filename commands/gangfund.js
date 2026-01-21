const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../data/gangfund.json");
const FIX_ROLE_ID = "958217460039970883";
const FUND_AMOUNT = 50000;
const CHANNEL_ID = "1436993621214760981";

const PRELOADED_MEMBERS = {};

// --------------------------
// INIT JSON
// --------------------------
if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({
        week: 1,
        members: { ...PRELOADED_MEMBERS },
        totalWeek: 0,
        totalMonth: 0,
        prevMonthTotal: 0,
        totalAll: 0,
        due: Object.keys(PRELOADED_MEMBERS).length * FUND_AMOUNT,
        chartMsg: null,
        pendingMsg: null
    }, null, 2));
}

const load = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const save = d => fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));

// 💰 Formatter
function k(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
}

// 📆 Count Fridays in a month
function getFridaysInMonth(year, month) {
    let count = 0;
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
        if (d.getDay() === 5) count++;
        d.setDate(d.getDate() + 1);
    }
    return count;
}

// --------------------------
// Chart Embed with k/m formatter
// --------------------------
async function sendOrUpdateChart(client) {
    const data = load();
    const channel = await client.channels.fetch(CHANNEL_ID);

    let list = "";
    let pending = [];
    let i = 1;

    for (const id of Object.keys(data.members)) {
        const m = data.members[id];
        const previous = m.prev;
        const totalNeed = previous + FUND_AMOUNT;
        const paid = m.paid;
        const remaining = totalNeed - paid;

        let status = remaining <= 0 ? "✅ **Cleared**" : `❌ **Remaining ${k(remaining)}**`;
        if (remaining > 0) pending.push(`<@${id}>`);

        list += `**${i}: <@${id}>** | Previous: **${k(previous)}** + **${k(FUND_AMOUNT)}** = **${k(totalNeed)}** | Paid: **${k(paid)}** → ${status}\n`;
        i++;
    }

    const pendingStr = pending.length ? pending.join(", ") : "🎉 Everyone paid!";

    const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(`📊 **GANG WEEKLY FUND – WEEK ${data.week}**`)
        .setDescription(
`━━━━━━━━━━━━━━━━━━
💰 **Summary:**
━━━━━━━━━━━━━━━━━━
• **Total Fund This Week:** ${k(data.totalWeek)}
• **Total Fund This Month:** ${k(data.totalMonth)}
• **Previous Month Total:** ${k(data.prevMonthTotal)}
• **Total Fund So Far:** ${k(data.totalAll)}
• **Total Due:** ${k(data.due)}
━━━━━━━━━━━━━━━━━━
👥 **Member Payment List:**
━━━━━━━━━━━━━━━━━━
${list}
━━━━━━━━━━━━━━━━━━`
        )
        .setImage("https://media.discordapp.net/attachments/1328281349471342593/1461291979408412841/standard_4.gif")
        .setFooter({ 
            text: "👑Royal Syndicate Management",
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();


// --------------------------
// Send a new chart (keep old chart)
// --------------------------
const chartMsg = await channel.send({ content: `<@&${FIX_ROLE_ID}>`, embeds: [embed] });
data.chartMsg = chartMsg.id; // Update last chart reference (optional)
save(data);

    // --------------------------
    // Delete old pending & send new
    // --------------------------
    if (data.pendingMsg) {
        try {
            const oldPending = await channel.messages.fetch(data.pendingMsg);
            await oldPending.delete();
        } catch {}
    }

    const pm = await channel.send(`❌ **Pending Members:**\n${pendingStr}`);
    data.pendingMsg = pm.id;
    save(data);
}


// --------------------------
// AUTO / MANUAL NEW WEEK
// --------------------------
async function startNewWeek(client) {
    const data = load();
    const now = new Date();

    const fridays = getFridaysInMonth(now.getFullYear(), now.getMonth());

    if (data.week >= fridays) {
        data.prevMonthTotal = data.totalMonth;
        data.totalMonth = 0;
        data.week = 1;
    } else {
        data.week++;
    }

    for (const m of Object.values(data.members)) {
        const need = m.prev + FUND_AMOUNT;
        m.prev = Math.max(0, need - m.paid);
        m.paid = 0;
    }

    data.totalWeek = 0;
    data.due = Object.values(data.members)
        .reduce((a, m) => a + m.prev + FUND_AMOUNT, 0);

    save(data);
    await sendOrUpdateChart(client);
}

// --------------------------
// SLASH COMMAND
// --------------------------
module.exports = {
    data: new SlashCommandBuilder()
        .setName("gangfund")
        .setDescription("Gang fund management system")
        .addSubcommand(s => s
            .setName("chart")
            .setDescription("Show the current gang fund chart"))
        .addSubcommand(s => s
            .setName("newweek")
            .setDescription("Start a new week manually"))
        .addSubcommand(s => s
            .setName("pay")
            .setDescription("Pay multiple members at once")
            .addIntegerOption(o => o
                .setName("amount")
                .setDescription("Amount to pay")
                .setRequired(true))
            .addStringOption(o => o
                .setName("members")
                .setDescription("Member IDs separated by comma")
                .setRequired(true)))
        .addSubcommand(s => s
            .setName("addmember")
            .setDescription("Add a new member")
            .addUserOption(o => o
                .setName("member")
                .setDescription("The user to add")
                .setRequired(true)))

         .addSubcommand(s => s.setName("reset").setDescription("Reset the entire system"))

        
        .addSubcommand(s => s
            .setName("removemember")
            .setDescription("Remove a member")
            .addUserOption(o => o
                .setName("member")
                .setDescription("The user to remove")
                .setRequired(true))),

    async execute(interaction) {
        const data = load();
        const sub = interaction.options.getSubcommand();


          // ✅ Allowed role check from .env
        if (!process.env.ALLOWED_GANGFUND_ROLE) return interaction.reply({
            content: "⚠️ Server is not configured with allowed Gangfund roles.",
            ephemeral: true
        });

        const ALLOWED_ROLE = process.env.ALLOWED_GANGFUND_ROLE.split(",");
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLE.includes(r.id))) {
            return interaction.reply({
                content: "❌ You don't have permission to use this commands.",
                ephemeral: true
            });
        }

        if (sub === "chart") {
            await sendOrUpdateChart(interaction.client);
            return interaction.reply({ content: "📊 Chart updated", ephemeral: true });
        }

        if (sub === "newweek") {
            await startNewWeek(interaction.client);
            return interaction.reply({ content: "🆕 New week started", ephemeral: true });
        }

        if (sub === "addmember") {
            const u = interaction.options.getUser("member");
            data.members[u.id] = { paid: 0, prev: 0 };
            save(data);
            await sendOrUpdateChart(interaction.client);
            return interaction.reply({ content: `✅ Added ${u.username}`, ephemeral: true });
        }

        if (sub === "removemember") {
            const u = interaction.options.getUser("member");
            delete data.members[u.id];
            save(data);
            await sendOrUpdateChart(interaction.client);
            return interaction.reply({ content: `🚫 Removed ${u.username}`, ephemeral: true });
        }

        if (sub === "reset") {
    for (const id of Object.keys(data.members)) {
        data.members[id].paid = 0;
        data.members[id].prev = 0;
    }
    data.week = 1;
    data.totalWeek = 0;
    data.totalMonth = 0;
    data.prevMonthTotal = 0;
    data.totalAll = 0;
    data.due = Object.keys(data.members).length * FUND_AMOUNT;
    data.chartMsg = null;
    data.pendingMsg = null;

    save(data);
    await sendOrUpdateChart(interaction.client);

    return interaction.reply({ content: "🧨 **FULL RESET DONE!** System wiped and set to Week 1.", ephemeral: true });
}


        if (sub === "pay") {
            const amount = interaction.options.getInteger("amount");
            const ids = interaction.options.getString("members")
                .split(",").map(x => x.replace(/[<@!>]/g, "").trim());

            let count = 0;
            for (const id of ids) {
                if (data.members[id]) {
                    data.members[id].paid += amount;
                    count++;
                }
            }

            data.totalWeek += amount * count;
            data.totalMonth += amount * count;
            data.totalAll += amount * count;

            save(data);
            await sendOrUpdateChart(interaction.client);

            return interaction.reply({ content: `💸 Paid ${k(amount)} × ${count} member(s)`, ephemeral: true });
        }
    },

    sendOrUpdateChart,
    startNewWeek
};
