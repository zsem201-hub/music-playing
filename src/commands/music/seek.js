import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to a specific time in the song')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time to seek to (format: mm:ss or seconds)')
                .setRequired(true)
        ),
    cooldown: 3,

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

        const timeInput = interaction.options.getString('time');
        let seekTime;

        // Parse time input
        if (timeInput.includes(':')) {
            const parts = timeInput.split(':').map(Number);
            if (parts.length === 2) {
                seekTime = parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                seekTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        } else {
            seekTime = parseInt(timeInput);
        }

        if (isNaN(seekTime) || seekTime < 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ Invalid time format! Use `mm:ss` or seconds.')
                ],
                ephemeral: true
            });
        }

        const seekMs = seekTime * 1000;
        const track = queue.currentTrack;

        if (seekMs > track.durationMS) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`❌ Cannot seek beyond the song duration (${track.duration})!`)
                ],
                ephemeral: true
            });
        }

        await queue.node.seek(seekMs);

        const minutes = Math.floor(seekTime / 60);
        const seconds = seekTime % 60;
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('⏩ Seeked')
            .setDescription(`Seeked to **${timeFormatted}** in **[${track.title}](${track.url})**`)
            .setThumbnail(track.thumbnail)
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
