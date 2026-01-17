import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song'),
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

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar({
            timecodes: true,
            queue: false,
            length: 15,
            indicator: '🔵',
            leftChar: '▬',
            rightChar: '▬'
        });

        const timestamp = queue.node.getTimestamp();

        const loopModes = {
            0: 'Off',
            1: '🔂 Track',
            2: '🔁 Queue',
            3: '♾️ Autoplay'
        };

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setAuthor({ name: '🎵 Now Playing' })
            .setTitle(track.title)
            .setURL(track.url)
            .setThumbnail(track.thumbnail)
            .setDescription(`\n${progress}\n`)
            .addFields(
                { name: '👤 Artist', value: track.author, inline: true },
                { name: '⏱️ Duration', value: `${timestamp.current.label} / ${track.duration}`, inline: true },
                { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true },
                { name: '🔄 Loop Mode', value: loopModes[queue.repeatMode], inline: true },
                { name: '📜 Queue', value: `${queue.tracks.size} songs`, inline: true },
                { name: '🎧 Requested by', value: `${track.requestedBy}`, inline: true }
            )
            .setFooter({ 
                text: `Source: ${track.source || 'Unknown'}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
