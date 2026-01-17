import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load all commands
const commandsPath = join(__dirname, 'commands');
const commandFolders = readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = await import(`file://${filePath}`);
        
        if ('data' in command.default) {
            commands.push(command.default.data.toJSON());
            console.log(`📦 Loaded: ${command.default.data.name}`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Refreshing ${commands.length} application (/) commands...`);

        // Deploy globally
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands!`);
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
