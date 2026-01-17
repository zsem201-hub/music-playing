import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the music volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
        ),
    cooldown: 2,

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ No music is currently playing!')
                ],
                ephemeral: true
            });
        }

        const level = interaction.options.getInteger('level');

        if (!level) {
            const currentVolume = queue.node.volume;
            const volumeBar = createVolumeBar(currentVolume);

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🔊 Current Volume')
                .setDescription(`${volumeBar}\n\n**Volume: ${currentVolume}%**`)
                .setFooter({ text: 'Use /volume <1-100> to change the volume' });

            return interaction.reply({ embeds: [embed] });
        }

        const oldVolume = queue.node.volume;
        queue.node.setVolume(level);

        const emoji = level > oldVolume ? '🔊' : level < oldVolume ? '🔉' : '🔊';
        const volumeBar = createVolumeBar(level);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`${emoji} Volume Changed`)
            .setDescription(`${volumeBar}\n\n**${oldVolume}%** → **${level}%**`)
            .setFooter({ 
                text: `Changed by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};

function createVolumeBar(volume) {
    const filled = Math.round(volume / 10);
    const empty = 10 - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}
