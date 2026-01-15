// ===========================
// BOT STARTUP
// ===========================
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes,
    EmbedBuilder
} = require("discord.js");

const cron = require("node-cron");

// ===========================
// CLIENT SETUP
// ===========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.User,
        Partials.GuildMember,
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

client.commands = new Collection();

// ===========================
// LOAD COMMANDS
// ===========================
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`⚠️ Invalid command file: ${file}`);
    }
}

// ===========================
// REGISTER SLASH COMMANDS
// ===========================
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("⏳ Registering slash commands...");
        const commands = client.commands.map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("✅ Slash commands registered.");
    } catch (err) {
        console.error("❌ Slash register error:", err);
    }
})();

// ===========================
// INTERACTION HANDLER
// ===========================
client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (err) {
            console.error(err);
            if (interaction.replied || interaction.deferred) {
                interaction.editReply({ content: "❌ Error executing command." });
            } else {
                interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
            }
        }
    }

    if (interaction.isButton()) {
        const handler = require("./events/interactionCreate");
        handler(interaction, client);
    }
});

// ===========================
// CONFIG
// ===========================
const {
    WELCOME_CHANNEL_ID,
    LEAVE_CHANNEL_ID,
    AUTO_ROLE_ID,
    SERVER_RULES_CHANNEL_ID,
    ABOUT_US_CHANNEL_ID,
    DM_FAIL_LOG_CHANNEL_ID
} = process.env;

const { welcomeMessages, leaveMessages } = require("./messages");

// ===========================
// UTIL FUNCTIONS
// ===========================
function formatMessage(template, member) {
    return template
        .replaceAll("{id}", member.id)
        .replaceAll("{rules}", SERVER_RULES_CHANNEL_ID)
        .replaceAll("{about}", ABOUT_US_CHANNEL_ID);
}

function buildEmbed(title, desc, color, member) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(desc)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
            text: "ROYAL SYNDICATE Family",
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();
}

// ===========================
// MEMBER JOIN WITH ANIMATED GIF
// ===========================
client.on("guildMemberAdd", async member => {
    try {
        // Auto role
        const role = await member.guild.roles.fetch(AUTO_ROLE_ID);
        if (role) await member.roles.add(role);
        console.log(`🎭 Added role to ${member.user.tag}`);
    } catch (e) {
        console.error("❌ Role add error:", e);
    }

    // Random welcome message
    const msg = formatMessage(
        welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
        member
    );

    // Build embed
    const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("👑 Welcome to ROYAL SYNDICATE 👑")
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Family", iconURL: client.user.displayAvatarURL() })
        .setTimestamp()
        // ✅ Add your animated GIF here
        .setImage("https://cdn.discordapp.com/attachments/1328281349471342593/1461291979408412841/standard_4.gif?ex=696a05b5&is=6968b435&hm=f70192a3c84b7e517ef72028fd182713ed6ec67c0d0bd0d70882cc5ecc353194");

    // Send to Welcome Channel
    const ch = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (ch) {
        ch.send({ embeds: [embed] })
          .then(() => console.log(`📩 Welcome embed sent in #${ch.name}`))
          .catch(console.error);
    }

    // Optional DM
    try {
        await member.send({ embeds: [embed] });
        console.log(`📩 Sent welcome DM to ${member.user.tag}`);
    } catch (err) {
        console.error(`⚠️ Could not send DM: ${err.message}`);
    }
});

// ===========================
// MEMBER LEAVE
// ===========================
client.on("guildMemberRemove", async member => {
    const msg = formatMessage(
        leaveMessages[Math.floor(Math.random() * leaveMessages.length)],
        member
    );

    const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("👋 Goodbye from ROYAL SYNDICATE")
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        // 🔥 Animated GIF graph / banner
        .setImage("https://cdn.discordapp.com/attachments/1328281349471342593/1461291979408412841/standard_4.gif?ex=696a05b5&is=6968b435&hm=f70192a3c84b7e517ef72028fd182713ed6ec67c0d0bd0d70882cc5ecc353194")
        .setFooter({ 
            text: "ROYAL SYNDICATE Family",
            iconURL: member.guild.iconURL({ dynamic: true })
        })
        .setTimestamp();

    // 🔴 Try DM
    try {
        await member.send({ embeds: [embed] });
    } catch (err) {
        const log = member.guild.channels.cache.get(DM_FAIL_LOG_CHANNEL_ID);
        if (log) {
            log.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("DarkRed")
                        .setTitle("⚠️ DM Failed")
                        .setDescription(`DM failed to **${member.user.tag}**`)
                        .addFields({ name: "Reason", value: err.message || "DM Closed" })
                        .setTimestamp()
                ]
            });
        }
    }

    // 🔴 Send to Leave Channel
    const ch = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (ch) ch.send({ embeds: [embed] });
});


// ===========================
// READY EVENT
// ===========================
client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    client.user.setActivity("ROYAL SYNDICATE", { type: 0 });

    // 🔥 AUTO FRIDAY GANG FUND
    const { startNewWeek } = require("./commands/gangfund");

    // Every Friday 12 PM BD (06:00 UTC)
    cron.schedule("0 6 * * 5", async () => {
        try {
            console.log("📊 GangFund auto week process...");
            await startNewWeek(client);
            console.log("✅ GangFund updated");
        } catch (err) {
            console.error("❌ GangFund cron error:", err);
        }
    });

    // Auto systems
    require("./banChecker").banChecker(client);
    require("./loaChecker").loaChecker(client);
    require("./logger")(client);
});

// ===========================
// LOGIN
// ===========================
client.login(process.env.TOKEN);
