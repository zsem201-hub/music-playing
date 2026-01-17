export default {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`
╔════════════════════════════════════════╗
║     🎵 Discord Music Bot 2025 🎵       ║
╠════════════════════════════════════════╣
║  Bot: ${client.user.tag.padEnd(30)} ║
║  Servers: ${String(client.guilds.cache.size).padEnd(27)} ║
║  Status: Online ✅                     ║
╚════════════════════════════════════════╝
        `);
        
        client.user.setPresence({
            activities: [{ name: '/play | 🎵 Music Bot', type: 2 }],
            status: 'online'
        });
    }
};
