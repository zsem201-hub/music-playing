import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or playlist link')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('source')
                .setDescription('Select music source')
                .setRequired(false)
                .addChoices(
                    { name: '🔴 YouTube', value: 'youtube' },
                    { name: '🟢 Spotify', value: 'spotify' },
                    { name: '🟠 SoundCloud', value: 'soundcloud' },
                    { name: '🔵 Auto Detect', value: 'auto' }
                )
        ),
    cooldown: 3,

    async execute(interaction, client) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ You need to be in a voice channel to play music!')
                ],
                ephemeral: true
            });
        }

        const permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ I need permission to join and speak in your voice channel!')
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || 'auto';

        let searchEngine;
        switch (source) {
            case 'youtube':
                searchEngine = QueryType.YOUTUBE;
                break;
            case 'spotify':
                searchEngine = QueryType.SPOTIFY_SEARCH;
                break;
            case 'soundcloud':
                searchEngine = QueryType.SOUNDCLOUD_SEARCH;
                break;
            default:
                searchEngine = QueryType.AUTO;
        }

        try {
            const result = await player.play(channel, query, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEnd: false,
                    leaveOnEndCooldown: 300000
                },
                requestedBy: interaction.user,
                searchEngine: searchEngine
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎵 Added to Queue')
                .setDescription(`**[${result.track.title}](${result.track.url})**`)
                .setThumbnail(result.track.thumbnail)
                .addFields(
                    { name: '👤 Artist', value: result.track.author, inline: true },
                    { name: '⏱️ Duration', value: result.track.duration, inline: true },
                    { name: '📍 Position', value: `#${result.queue.tracks.size + 1}`, inline: true }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            if (result.playlist) {
                embed.setTitle('🎵 Playlist Added')
                    .setDescription(`**${result.playlist.title}**\n${result.playlist.tracks.length} tracks added!`);
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Play error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Error')
                .setDescription(`Could not play the requested song.\n\`\`\`${error.message}\`\`\``)
                .setFooter({ text: 'Try a different song or source' });

            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};
