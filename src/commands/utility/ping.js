import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),
    cooldown: 5,

    async execute(interaction) {
        const sent = await interaction.deferReply({ fetchReply: true });
        
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        const getLatencyEmoji = (ms) => {
            if (ms < 100) return '🟢';
            if (ms < 200) return '🟡';
            return '🔴';
        };

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🏓 Pong!')
            .addFields(
                { 
                    name: `${getLatencyEmoji(roundtrip)} Roundtrip`, 
                    value: `\`${roundtrip}ms\``, 
                    inline: true 
                },
                { 
                    name: `${getLatencyEmoji(wsLatency)} WebSocket`, 
                    value: `\`${wsLatency}ms\``, 
                    inline: true 
                }
            )
            .setFooter({ text: `Uptime: ${formatUptime(interaction.client.uptime)}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}
