const { REST, Routes } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

// Path to commands folder
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Loop through commands folder and push each command's data
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`⚠️ Command at ./commands/${file} missing "data" or "execute"`);
    }
}

// Setup REST
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 Registering ${commands.length} slash command(s)...`);

        // Guild-specific commands (instant)
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Commands registered successfully!`);
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
})();
