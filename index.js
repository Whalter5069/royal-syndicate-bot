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

// ?? Client Setup
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

// ?? Load Commands from ./commands folder
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`?? Command at ${filePath} missing "data" or "execute"`);
    }
}

// ?? Register Slash Commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("?? Registering slash commands...");
        const commands = client.commands.map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log("? Slash commands registered.");
    } catch (error) {
        console.error("? Error registering commands:", error);
    }
})();

// ?? Handle Slash Commands
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: "? Error executing command!", ephemeral: true });
        } else {
            await interaction.reply({ content: "? Error executing command!", ephemeral: true });
        }
    }
});

// ?? Config from .env
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const LEAVE_CHANNEL_ID = process.env.LEAVE_CHANNEL_ID;
const AUTO_ROLE_ID = process.env.AUTO_ROLE_ID;
const RULES_CHANNEL_ID = process.env.SERVER_RULES_CHANNEL_ID;
const ABOUT_US_CHANNEL_ID = process.env.ABOUT_US_CHANNEL_ID;

// ?? Member Join
client.on("guildMemberAdd", async (member) => {
    console.log(`?? New member joined: ${member.user.tag}`);

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) {
        console.log("?? Welcome channel not found!");
        return;
    }

    try {
        // Auto Role 
        const role = await member.guild.roles.fetch(AUTO_ROLE_ID);
        if (role) {
            await member.roles.add(role);
            console.log(`? Role ${role.name} added to ${member.user.tag}`);
        } else {
            console.log("?? Auto Role not found!");
        }
    } catch (err) {
        console.error("? Failed to add role:", err);
    }

    // Welcome Embed
    const welcomeEmbed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("?? Welcome to ROYAL SYNDICATE!")
        .setDescription(
`?? ASSALAMU ALAIKUM <@${member.id}>, Welcome to **ROYAL SYNDICATE Community**!  

?? Please Read and Follow The Server Rules ? <#${RULES_CHANNEL_ID}>  

?? Want to know about **ROYAL SYNDICATE**?  

??? We Are An Official Gang of Dream Life Roleplay Bangladesh (GTA V RP).  

?? To Know More, Check ? <#${ABOUT_US_CHANNEL_ID}>  

?? Thanks For Joining & Supporting Us, <@${member.id}> ??`
        )
        .addFields(
            { name: "?? You Are Member #", value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE Family", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });
});

// ? Member Leave
client.on("guildMemberRemove", async (member) => {
    const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setColor("#ff3333")
        .setTitle("?? Member Left")
        .setDescription(
`?? <@${member.id}> You Are No Longer On Our Server...  

?? **ROYAL SYNDICATE** ???? ?????? boring ??? ????!  

?? Goodbye, Take Care of Yourself...  
?? Chole Gele Eivabe ? See You Not For Mind Shamol Da !`
        )
        .addFields(
            { name: "?? Current Member Count", value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "ROYAL SYNDICATE", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    try {
        await channel.send({ embeds: [leaveEmbed] });
        console.log(`?? Sent leave message for ${member.user.tag}`);
    } catch (err) {
        console.error("? Failed to send leave message:", err);
    }
});

// ?? Ready Event (fixed)
client.once("ready", () => {
   console.log(`? Logged in as ${client.user.tag}`);
});

// ?? Start Bot
client.login(process.env.TOKEN);

// ?? Logger System
const logger = require("./logger");
logger(client);
