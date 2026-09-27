const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('./config.json');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// Anti-raid threshold variables
const deletedChannelsTracker = new Map();
const DELETION_LIMIT = 3; 
const TIME_WINDOW = 10000; // 10 seconds

client.once('ready', () => {
    console.log(`[SECURITY ONLINE] Authenticated as \${client.user.tag}`);
});

// 1. Anti-Link & Anti-Phishing Protection
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Regex to detect standard invites and potentially malicious links
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/)/g;

    if (linkRegex.test(message.content) || inviteRegex.test(message.content)) {
        // Bypass if user has a protected role (Admin/Mod)
        const hasBypass = message.member.roles.cache.some(role => config.protected_roles.includes(role.id));
        if (hasBypass) return;

        try {
            await message.delete();
            const warning = await message.channel.send(`⚠️ \${message.author}, external links and invites are restricted for security reasons.`);
            setTimeout(() => warning.delete().catch(() => null), 5000);

            // Log action
            logSecurityAlert('Suspicious Link Intercepted', `User: \${message.author.tag}\nContent: \`${message.content}\``, 0xffa500);
        } catch (error) {
            console.error('Failed to process anti-link action:', error);
        }
    }
});

// 2. Anti-Nuke / Anti-Channel Deletion Protection
client.on('channelDelete', async (channel) => {
    const guild = channel.guild;
    if (!guild) return;

    try {
        // Fetch audit logs to see who deleted the channel
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete,
        });
        
        const deletionLog = fetchedLogs.entries.first();
        if (!deletionLog) return;

        const { executor } = deletionLog;
        if (executor.id === client.user.id) return; // Ignore if the bot did it

        const now = Date.now();
        if (!deletedChannelsTracker.has(executor.id)) {
            deletedChannelsTracker.set(executor.id, []);
        }

        const timestamps = deletedChannelsTracker.get(executor.id);
        timestamps.push(now);

        // Filter timestamps within the time window
        const recentDeletions = timestamps.filter(time => now - time < TIME_WINDOW);
        deletedChannelsTracker.set(executor.id, recentDeletions);

        if (recentDeletions.length >= DELETION_LIMIT) {
            // Trigger emergency lockdown on the malicious user/hacked staff account
            const member = await guild.members.fetch(executor.id);
            if (member) {
                await member.roles.set([]).catch(() => null); // Strip all roles immediately
                await member.timeout(24 * 60 * 60 * 1000, 'Anti-Nuke: Mass channel deletion triggered.').catch(() => null);
                
                logSecurityAlert(
                    '🚨 EMERGENCY LOCKDOWN TRIGGERED', 
                    `User **${executor.tag}** deleted ${recentDeletions.length} channels in under ${TIME_WINDOW / 1000}s.\nAll roles removed, user timed out.`, 
                    0xff0000
                );
            }
        }
    } catch (error) {
        console.error('Error handling channel deletion security:', error);
    }
});

// Helper function to send logs to a secure channel
function logSecurityAlert(title, description, color) {
    const logChannel = client.channels.cache.get(config.log_channel_id);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => null);
}

client.login(process.env.DISCORD_TOKEN);
