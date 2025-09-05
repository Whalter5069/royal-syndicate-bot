// logger.js
const { EmbedBuilder, AuditLogEvent } = require("discord.js");

// লগ চ্যানেল ID বসাও
const LOG_CHANNEL_ID = "1413508418962194544";

module.exports = (client) => {
    const sendLog = async (guild, embed) => {
        try {
            const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) await logChannel.send({ embeds: [embed] });
        } catch (err) {
            console.error("❌ Log send failed:", err);
        }
    };

    // Helper → embed বানানো
    const buildEmbed = (color, title, desc, targetUser, ids, executor) => {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(desc)
            .addFields({ name: "IDs", value: ids })
            .setTimestamp()
            .setFooter({
                text: client.user.username,
                iconURL: client.user.displayAvatarURL()
            });

        if (targetUser) {
            embed.setAuthor({
                name: targetUser.tag,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            });
        }

        if (executor) {
            embed.addFields({
                name: "BY",
                value: `<@${executor.id}> (\`${executor.id}\`)`
            });
        }

        return embed;
    };

    // ✅ Member Join
    client.on("guildMemberAdd", (member) => {
        const desc = `👤 <@${member.id}> joined the server.`;
        const ids = `<@${member.id}> (\`${member.id}\`)`;
        const embed = buildEmbed("Green", "✅ Member Joined", desc, member.user, ids);
        sendLog(member.guild, embed);
    });

    // ❌ Member Leave / Kick detect
    client.on("guildMemberRemove", async (member) => {
        const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
        const kickLog = fetchedLogs.entries.first();
        let desc, title, executor;

        if (kickLog && kickLog.target.id === member.id) {
            title = "🔨 Member Kicked";
            desc = `👤 <@${member.id}> was kicked.`;
            executor = kickLog.executor;
        } else {
            title = "❌ Member Left";
            desc = `👤 <@${member.id}> left the server.`;
        }

        const ids = `<@${member.id}> (\`${member.id}\`)`;
        const embed = buildEmbed("Red", title, desc, member.user, ids, executor);
        sendLog(member.guild, embed);
    });
// 📝 Message Create
client.on("messageCreate", (message) => {
    if (!message.guild || message.author.bot) return;

    const desc = `💬 Message sent in ${message.channel}`;
    const ids = `👤 User: <@${message.author.id}> (\`${message.author.id}\`)\n` +
                `#️⃣ Channel: <#${message.channel.id}> (\`${message.channel.id}\`)`;

    const embed = buildEmbed("Green", "💬 Message Sent", desc, message.author, ids)
        .addFields({ name: "Content", value: message.content || "*(embed/attachment)*" });

    sendLog(message.guild, embed);
});

// 🗑️ Message Delete
client.on("messageDelete", async (message) => {
    if (!message.guild) return;

    let executor;
    try {
        const audit = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
        const entry = audit.entries.first();
        if (entry && entry.target.id === message.author?.id) executor = entry.executor;
    } catch {}

    const desc = `🗑️ Message deleted in ${message.channel}`;
    const ids = `👤 User: ${message.author ? `<@${message.author.id}> (\`${message.author.id}\`)` : "Unknown"}\n` +
                `#️⃣ Channel: <#${message.channel.id}> (\`${message.channel.id}\`)`;

    const embed = buildEmbed("Orange", "🗑️ Message Deleted", desc, message.author, ids, executor)
        .addFields({ name: "Content", value: message.content || "*(embed/attachment)*" });

    sendLog(message.guild, embed);
});

// ✏️ Message Edit
client.on("messageUpdate", (oldMsg, newMsg) => {
    if (!oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const desc = `✏️ Message edited in ${oldMsg.channel}`;
    const ids = `👤 User: <@${oldMsg.author.id}> (\`${oldMsg.author.id}\`)\n` +
                `#️⃣ Channel: <#${oldMsg.channel.id}> (\`${oldMsg.channel.id}\`)`;

    const embed = buildEmbed("Blue", "✏️ Message Edited", desc, oldMsg.author, ids)
        .addFields(
            { name: "Before", value: oldMsg.content || "*(empty)*" },
            { name: "After", value: newMsg.content || "*(empty)*" }
        );

    sendLog(oldMsg.guild, embed);
});


    // 🔒 Ban
    client.on("guildBanAdd", async (ban) => {
        const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `🔒 <@${ban.user.id}> was banned.`;
        const ids = `<@${ban.user.id}> (\`${ban.user.id}\`)`;
        const embed = buildEmbed("DarkRed", "🔒 Member Banned", desc, ban.user, ids, executor);
        sendLog(ban.guild, embed);
    });

    // 🔓 Unban
    client.on("guildBanRemove", async (ban) => {
        const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `🔓 <@${ban.user.id}> was unbanned.`;
        const ids = `<@${ban.user.id}> (\`${ban.user.id}\`)`;
        const embed = buildEmbed("Green", "🔓 Member Unbanned", desc, ban.user, ids, executor);
        sendLog(ban.guild, embed);
    });


    
   // 📛 Nickname Change
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
        // নিশ্চিত করো যে full data আছে
        if (!oldMember.partial) await oldMember.fetch();
        if (!newMember.partial) await newMember.fetch();

        if (oldMember.nickname !== newMember.nickname) {
            const audit = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
            const entry = audit.entries.first();
            const executor = entry?.executor;

            const desc = `📛 Nickname changed for <@${newMember.id}>`;
            const ids = `<@${newMember.id}> (\`${newMember.id}\`)`;

            const embed = buildEmbed(
                "Yellow",
                "📛 Nickname Changed",
                desc,
                newMember.user,
                ids,
                executor || newMember.user
            ).addFields(
                { name: "Before", value: oldMember.nickname || oldMember.user.username, inline: true },
                { name: "After", value: newMember.nickname || newMember.user.username, inline: true }
            );

            sendLog(newMember.guild, embed);
        }
    } catch (err) {
        console.error("❌ Nickname log error:", err);
    }
});


    // 🎭 Role Add/Remove
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const oldRoles = oldMember.roles.cache.map(r => r.id);
        const newRoles = newMember.roles.cache.map(r => r.id);

        const added = newRoles.filter(r => !oldRoles.includes(r));
        const removed = oldRoles.filter(r => !newRoles.includes(r));

        if (added.length || removed.length) {
            const audit = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
            const entry = audit.entries.first();
            const executor = entry?.executor;

            if (added.length) {
                const desc = `➕ Roles Given\n<@&${added.join(", ")}>`;
                const ids = `<@${newMember.id}> (\`${newMember.id}\`)`;
                const embed = buildEmbed("Green", "🎭 Role Added", desc, newMember.user, ids, executor);
                sendLog(newMember.guild, embed);
            }

            if (removed.length) {
                const desc = `➖ Roles Removed\n<@&${removed.join(", ")}>`;
                const ids = `<@${newMember.id}> (\`${newMember.id}\`)`;
                const embed = buildEmbed("Red", "🎭 Role Removed", desc, newMember.user, ids, executor);
                sendLog(newMember.guild, embed);
            }
        }
    });

    // 📡 Channel Create/Delete
    client.on("channelCreate", async (channel) => {
        const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `📡 Channel created: ${channel}`;
        const ids = `${channel.name} (\`${channel.id}\`)`;
        const embed = buildEmbed("Green", "📡 Channel Created", desc, executor, ids, executor);
        sendLog(channel.guild, embed);
    });

    client.on("channelDelete", async (channel) => {
        const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `❌ Channel deleted: ${channel.name}`;
        const ids = `${channel.name} (\`${channel.id}\`)`;
        const embed = buildEmbed("Red", "❌ Channel Deleted", desc, executor, ids, executor);
        sendLog(channel.guild, embed);
    });

// ✏️ Channel Update (Rename ইত্যাদি)
client.on("channelUpdate", async (oldChannel, newChannel) => {
    // নাম change detect
    if (oldChannel.name !== newChannel.name) {
        const audit = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `✏️ Channel renamed: \`${oldChannel.name}\` ➝ \`${newChannel.name}\``;
        const ids = `${oldChannel.name} (\`${oldChannel.id}\`) ➝ ${newChannel.name} (\`${newChannel.id}\`)`;

        const embed = buildEmbed("Yellow", "✏️ Channel Renamed", desc, executor, ids, executor);
        sendLog(newChannel.guild, embed);
    }
});


    // 🎭 Role Create/Delete/Update
    client.on("roleCreate", async (role) => {
        const audit = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `🎭 Role created: ${role}`;
        const ids = `${role.name} (\`${role.id}\`)`;
        const embed = buildEmbed("Green", "🎭 Role Created", desc, executor, ids, executor);
        sendLog(role.guild, embed);
    });

    client.on("roleDelete", async (role) => {
        const audit = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
        const entry = audit.entries.first();
        const executor = entry?.executor;

        const desc = `❌ Role deleted: ${role.name}`;
        const ids = `${role.name} (\`${role.id}\`)`;
        const embed = buildEmbed("Red", "❌ Role Deleted", desc, executor, ids, executor);
        sendLog(role.guild, embed);
    });

    client.on("roleUpdate", async (oldRole, newRole) => {
        if (oldRole.name !== newRole.name) {
            const audit = await newRole.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate });
            const entry = audit.entries.first();
            const executor = entry?.executor;

            const desc = `🎭 Role renamed.`;
            const ids = `${oldRole.name} (\`${oldRole.id}\`) ➝ ${newRole.name} (\`${newRole.id}\`)`;
            const embed = buildEmbed("Yellow", "🎭 Role Renamed", desc, executor, ids, executor);
            sendLog(newRole.guild, embed);
        }
    });

    // 🎙️ Voice State
    client.on("voiceStateUpdate", (oldState, newState) => {
        if (!oldState.channel && newState.channel) {
            const desc = `🎙️ <@${newState.id}> joined voice channel 🔊 ${newState.channel}`;
            const ids = `<@${newState.id}> (\`${newState.id}\`)\n${newState.channel} (\`${newState.channel.id}\`)`;
            const embed = buildEmbed("Green", "🎙️ Voice Join", desc, newState.member.user, ids);
            sendLog(newState.guild, embed);
        } else if (oldState.channel && !newState.channel) {
            const desc = `🎙️ <@${oldState.id}> left voice channel 🔊 ${oldState.channel}`;
            const ids = `<@${oldState.id}> (\`${oldState.id}\`)\n${oldState.channel} (\`${oldState.channel.id}\`)`;
            const embed = buildEmbed("Red", "🎙️ Voice Leave", desc, oldState.member.user, ids);
            sendLog(oldState.guild, embed);
        } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const desc = `🎙️ <@${newState.id}> moved from 🔊 ${oldState.channel} ➝ ${newState.channel}`;
            const ids = `<@${newState.id}> (\`${newState.id}\`)\n${oldState.channel} (\`${oldState.channel.id}\`)\n${newState.channel} (\`${newState.channel.id}\`)`;
            const embed = buildEmbed("Yellow", "🎙️ Voice Move", desc, newState.member.user, ids);
            sendLog(newState.guild, embed);
        }
    });
};
