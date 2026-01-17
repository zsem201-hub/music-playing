import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue, QueueRepeatMode } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set loop mode')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode')
                .setRequired(true)
                .addChoices(
                    { name: '❌ Off', value: 'off' },
                    { name: '🔂 Track', value: 'track' },
                    { name: '🔁 Queue', value: 'queue' },
                    { name: '♾️ Autoplay', value: 'autoplay' }
                )
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

        const mode = interaction.options.getString('mode');
        let repeatMode;
        let modeName;
        let emoji;
        let color;

        switch (mode) {
            case 'off':
                repeatMode = QueueRepeatMode.OFF;
                modeName = 'Off';
                emoji = '❌';
                color = 0xff6b6b;
                break;
            case 'track':
                repeatMode = QueueRepeatMode.TRACK;
                modeName = 'Track';
                emoji = '🔂';
                color = 0x00ff00;
                break;
            case 'queue':
                repeatMode = QueueRepeatMode.QUEUE;
                modeName = 'Queue';
                emoji = '🔁';
                color = 0x0099ff;
                break;
            case 'autoplay':
                repeatMode = QueueRepeatMode.AUTOPLAY;
                modeName = 'Autoplay';
                emoji = '♾️';
                color = 0x9b59b6;
                break;
        }

        queue.setRepeatMode(repeatMode);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} Loop Mode`)
            .setDescription(`Loop mode has been set to **${modeName}**`)
            .addFields({
                name: 'Current Track',
                value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`
            })
            .setFooter({ 
                text: `Changed by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
