const fs = require("fs");
const path = require("path");
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection, 
    EmbedBuilder, 
    REST, 
    Routes 
} = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration, // ⬅️ Ban/Unban এর জন্য দরকার
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

// 🔹 Load Commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`⚠️ Command at ${filePath} missing "data" or "execute"`);
    }
}

// 🔹 Register Slash Commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🔄 Registering slash commands...");
        const commands = client.commands.map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log("✅ Slash commands registered.");
    } catch (error) {
        console.error(error);
    }
})();

// 🔹 Handle Slash Command Execution
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "❌ Error executing command!", ephemeral: true });
    }
});

// 📌 Config from .env
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const LEAVE_CHANNEL_ID = process.env.LEAVE_CHANNEL_ID;
const AUTO_ROLE_ID = process.env.AUTO_ROLE_ID;
const RULES_CHANNEL_ID = process.env.SERVER_RULES_CHANNEL_ID;
const ABOUT_US_CHANNEL_ID = process.env.ABOUT_US_CHANNEL_ID;

// 🎉 Member Join
client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    // Auto Role
    const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
    if (role) {
        try {
            await member.roles.add(role);
            console.log(`✅ Role ${role.name} added to ${member.user.tag}`);
        } catch (err) {
            console.error("❌ Failed to add role:", err);
        }
    }

    const welcomeEmbed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("👑 Welcome to ROYAL SYNDICATE!")
        .setDescription(
`🤝 ASSALAMU ALAIKUM <@${member.id}>, Welcome to **ROYAL SYNDICATE Community**!  

📜 Please Read and Follow The Server Rules → <#${RULES_CHANNEL_ID}>  

🚧 Want to know about **ROYAL SYNDICATE**?  

🧛 We Are An Official Gang of Dream Life Roleplay Bangladesh (GTA V RP).  

📋 To Know More, Check → <#${ABOUT_US_CHANNEL_ID}>  

❤️ Thanks For Joining & Supporting Us, <@${member.id}> ❤️`
        )
        .addFields(
            { name: "📊 You Are Member #", value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Family", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });
});


// ❌ Member Leave
client.on("guildMemberRemove", async (member) => {
    const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!channel) return;

    // Embed for Server Leave Channel (with member count)
    const leaveEmbed = new EmbedBuilder()
        .setColor("#ff3333")
        .setTitle("👋 Member Left")
        .setDescription(
`☹️ <@${member.id}> You Are No Longer On Our Server...  

🔫 **ROYAL SYNDICATE** থেকে বের হইলা মানে জীবনটা boring হয়ে গেলো !  

🤓 Goodbye, Take Care of Yourself...  
😏 Chole Gele Eivabe ? See You Not For Mind Shamol Da !`
        )
        .addFields(
            { name: "📊 Current Member Count", value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    // Send to Leave Channel
    channel.send({ embeds: [leaveEmbed] });

    // Embed for Personal DM (without member count)
    const dmEmbed = new EmbedBuilder()
        .setColor("#ff3333")
        .setTitle("👋 You Left ROYAL SYNDICATE")
        .setDescription(
`☹️ ${member.user.username}, You are no longer part of our server.  

🔫 **ROYAL SYNDICATE** থেকে বের হইলা মানে জীবনটা boring হয়ে গেলো !  

🤓 Goodbye, Take Care of Yourself...  
😏 Chole Gele Eivabe ? See You Not For Mind Shamol Da !`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    // Send to DM
    try {
        await member.send({ embeds: [dmEmbed] });
        console.log(`📩 Sent leave DM to ${member.user.tag}`);
    } catch {
        console.log(`❌ Could not DM ${member.user.tag}. Probably has DMs disabled.`);
    }
});



client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);


const logger = require("./logger");
logger(client);
