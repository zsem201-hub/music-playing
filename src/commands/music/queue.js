import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
        ),
    cooldown: 5,

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

        const tracks = queue.tracks.toArray();
        const currentTrack = queue.currentTrack;

        if (tracks.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🎵 Now Playing')
                .setDescription(`**[${currentTrack.title}](${currentTrack.url})**`)
                .setThumbnail(currentTrack.thumbnail)
                .addFields(
                    { name: '👤 Artist', value: currentTrack.author, inline: true },
                    { name: '⏱️ Duration', value: currentTrack.duration, inline: true }
                )
                .setFooter({ text: 'Queue is empty. Add more songs with /play!' });

            return interaction.reply({ embeds: [embed] });
        }

        const itemsPerPage = 10;
        const pages = Math.ceil(tracks.length / itemsPerPage);
        let currentPage = interaction.options.getInteger('page') || 1;
        
        if (currentPage > pages) currentPage = pages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentTracks = tracks.slice(start, end);

        const queueList = currentTracks
            .map((track, index) => {
                const position = start + index + 1;
                const title = track.title.length > 40 
                    ? track.title.substring(0, 40) + '...' 
                    : track.title;
                return `**${position}.** [${title}](${track.url}) - \`${track.duration}\``;
            })
            .join('\n');

        const totalDuration = tracks.reduce((acc, track) => acc + track.durationMS, 0);
        const hours = Math.floor(totalDuration / 3600000);
        const minutes = Math.floor((totalDuration % 3600000) / 60000);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('📜 Music Queue')
            .setDescription(`**Now Playing:**\n[${currentTrack.title}](${currentTrack.url}) - \`${currentTrack.duration}\`\n\n**Up Next:**\n${queueList}`)
            .setThumbnail(currentTrack.thumbnail)
            .addFields(
                { name: '🎵 Total Songs', value: `${tracks.length + 1}`, inline: true },
                { name: '⏱️ Total Duration', value: `${hours}h ${minutes}m`, inline: true },
                { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true }
            )
            .setFooter({ text: `Page ${currentPage}/${pages} • Loop: ${queue.repeatMode === 0 ? 'Off' : queue.repeatMode === 1 ? 'Track' : 'Queue'}` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('queue_first')
                    .setEmoji('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId('queue_prev')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId('queue_page')
                    .setLabel(`${currentPage}/${pages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('queue_next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pages),
                new ButtonBuilder()
                    .setCustomId('queue_last')
                    .setEmoji('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === pages)
            );

        const message = await interaction.reply({ 
            embeds: [embed], 
            components: pages > 1 ? [row] : [],
            fetchReply: true 
        });

        if (pages > 1) {
            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 120000
            });

            collector.on('collect', async i => {
                if (i.customId === 'queue_first') currentPage = 1;
                else if (i.customId === 'queue_prev') currentPage--;
                else if (i.customId === 'queue_next') currentPage++;
                else if (i.customId === 'queue_last') currentPage = pages;

                const newStart = (currentPage - 1) * itemsPerPage;
                const newEnd = newStart + itemsPerPage;
                const newTracks = tracks.slice(newStart, newEnd);

                const newList = newTracks
                    .map((track, index) => {
                        const position = newStart + index + 1;
                        const title = track.title.length > 40 
                            ? track.title.substring(0, 40) + '...' 
                            : track.title;
                        return `**${position}.** [${title}](${track.url}) - \`${track.duration}\``;
                    })
                    .join('\n');

                embed.setDescription(`**Now Playing:**\n[${currentTrack.title}](${currentTrack.url}) - \`${currentTrack.duration}\`\n\n**Up Next:**\n${newList}`)
                    .setFooter({ text: `Page ${currentPage}/${pages} • Loop: ${queue.repeatMode === 0 ? 'Off' : queue.repeatMode === 1 ? 'Track' : 'Queue'}` });

                row.components[0].setDisabled(currentPage === 1);
                row.components[1].setDisabled(currentPage === 1);
                row.components[2].setLabel(`${currentPage}/${pages}`);
                row.components[3].setDisabled(currentPage === pages);
                row.components[4].setDisabled(currentPage === pages);

                await i.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', () => {
                row.components.forEach(c => c.setDisabled(true));
                message.edit({ components: [row] }).catch(() => {});
            });
        }
    }
};
