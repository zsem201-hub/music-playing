import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();
client.cooldowns = new Collection();

// Initialize Discord Player
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

// Register extractors
await player.extractors.register(YoutubeiExtractor, {});
await player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');

// Make player accessible globally
client.player = player;

// Load Commands
const loadCommands = async () => {
    const commandsPath = join(__dirname, 'commands');
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = join(commandsPath, folder);
        const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = join(folderPath, file);
            const command = await import(`file://${filePath}`);
            
            if ('data' in command.default && 'execute' in command.default) {
                client.commands.set(command.default.data.name, command.default);
                console.log(`✅ Loaded command: ${command.default.data.name}`);
            }
        }
    }
};

// Load Events
const loadEvents = async () => {
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        const event = await import(`file://${filePath}`);
        
        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args, client));
        } else {
            client.on(event.default.name, (...args) => event.default.execute(...args, client));
        }
        console.log(`✅ Loaded event: ${event.default.name}`);
    }
};

// Player Events
player.events.on('playerStart', (queue, track) => {
    const embed = {
        color: 0x00ff00,
        title: '🎵 Now Playing',
        description: `**[${track.title}](${track.url})**`,
        thumbnail: { url: track.thumbnail },
        fields: [
            { name: '👤 Artist', value: track.author, inline: true },
            { name: '⏱️ Duration', value: track.duration, inline: true },
            { name: '🎧 Requested by', value: `${track.requestedBy}`, inline: true }
        ],
        footer: { text: `Volume: ${queue.node.volume}%` }
    };
    queue.metadata.channel.send({ embeds: [embed] });
});

player.events.on('audioTrackAdd', (queue, track) => {
    const embed = {
        color: 0x0099ff,
        description: `✅ **[${track.title}](${track.url})** has been added to the queue!`,
        thumbnail: { url: track.thumbnail }
    };
    queue.metadata.channel.send({ embeds: [embed] });
});

player.events.on('disconnect', (queue) => {
    queue.metadata.channel.send('❌ I was disconnected from the voice channel. Queue cleared!');
});

player.events.on('emptyChannel', (queue) => {
    queue.metadata.channel.send('❌ Nobody is in the voice channel. Leaving...');
});

player.events.on('emptyQueue', (queue) => {
    queue.metadata.channel.send('✅ Queue finished! No more songs to play.');
});

player.events.on('error', (queue, error) => {
    console.error(`Player error: ${error.message}`);
    queue.metadata.channel.send(`❌ An error occurred: ${error.message}`);
});

// Initialize bot
const init = async () => {
    await loadCommands();
    await loadEvents();
    await client.login(process.env.DISCORD_TOKEN);
};

init().catch(console.error);

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    client.destroy();
    process.exit(0);
});

export { client, player };
