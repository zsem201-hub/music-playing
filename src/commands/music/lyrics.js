import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import Genius from 'genius-lyrics';

const genius = new Genius.Client();

export default {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the current song or search for lyrics')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name to search for (optional)')
        ),
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        let searchQuery = interaction.options.getString('song');

        if (!searchQuery) {
            const queue = useQueue(interaction.guild.id);
            
            if (!queue || !queue.isPlaying()) {
                return interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setDescription('❌ No music is playing! Please provide a song name or play some music first.')
                    ]
                });
            }

            searchQuery = `${queue.currentTrack.title} ${queue.currentTrack.author}`;
        }

        try {
            const searches = await genius.songs.search(searchQuery);
            
            if (!searches || searches.length === 0) {
                return interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xffff00)
                            .setDescription(`⚠️ No lyrics found for **${searchQuery}**`)
                    ]
                });
            }

            const song = searches[0];
            const lyrics = await song.lyrics();

            if (!lyrics) {
                return interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xffff00)
                            .setDescription(`⚠️ No lyrics available for **${song.title}**`)
                    ]
                });
            }

            // Split lyrics if too long
            const chunks = splitLyrics(lyrics, 4000);

            const embed = new EmbedBuilder()
                .setColor(0xffff00)
                .setTitle(`📝 ${song.title}`)
                .setURL(song.url)
                .setDescription(chunks[0])
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Artist: ${song.artist.name} • Powered by Genius` });

            await interaction.followUp({ embeds: [embed] });

            // Send additional parts if lyrics are too long
            for (let i = 1; i < chunks.length; i++) {
                const continueEmbed = new EmbedBuilder()
                    .setColor(0xffff00)
                    .setDescription(chunks[i])
                    .setFooter({ text: `Part ${i + 1}/${chunks.length}` });

                await interaction.channel.send({ embeds: [continueEmbed] });
            }

        } catch (error) {
            console.error('Lyrics error:', error);
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription(`❌ Failed to fetch lyrics: ${error.message}`)
                ]
            });
        }
    }
};

function splitLyrics(lyrics, maxLength) {
    const chunks = [];
    let currentChunk = '';

    const lines = lyrics.split('\n');

    for (const line of lines) {
        if ((currentChunk + line + '\n').length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}
