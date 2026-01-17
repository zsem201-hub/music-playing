import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

const filters = {
    bassboost: { name: 'Bass Boost', emoji: '🔊' },
    '8D': { name: '8D Audio', emoji: '🎧' },
    nightcore: { name: 'Nightcore', emoji: '🌙' },
    vaporwave: { name: 'Vaporwave', emoji: '🌊' },
    karaoke: { name: 'Karaoke', emoji: '🎤' },
    tremolo: { name: 'Tremolo', emoji: '〰️' },
    vibrato: { name: 'Vibrato', emoji: '📳' },
    reverse: { name: 'Reverse', emoji: '⏪' },
    treble: { name: 'Treble', emoji: '🔔' },
    normalizer: { name: 'Normalizer', emoji: '📊' },
    surrounding: { name: 'Surrounding', emoji: '🔈' },
    pulsator: { name: 'Pulsator', emoji: '💓' },
    subboost: { name: 'Sub Boost', emoji: '📢' },
    fadein: { name: 'Fade In', emoji: '📈' }
};

export default {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply audio filters to the music')
        .addStringOption(option => {
            option.setName('filter')
                .setDescription('Select a filter')
                .setRequired(false);
            
            Object.entries(filters).forEach(([key, value]) => {
                option.addChoices({ name: `${value.emoji} ${value.name}`, value: key });
            });
            
            option.addChoices({ name: '❌ Clear All', value: 'clear' });
            
            return option;
        }),
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

        const filter = interaction.options.getString('filter');

        if (!filter) {
            // Show current filters
            const enabledFilters = queue.filters.ffmpeg.getFiltersEnabled();
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🎛️ Audio Filters')
                .setDescription(enabledFilters.length > 0 
                    ? `**Active Filters:**\n${enabledFilters.map(f => `• ${filters[f]?.emoji || '🎵'} ${filters[f]?.name || f}`).join('\n')}`
                    : 'No filters are currently active.')
                .addFields({
                    name: 'Available Filters',
                    value: Object.entries(filters).map(([key, value]) => `${value.emoji} ${value.name}`).join(', ')
                })
                .setFooter({ text: 'Use /filter <name> to toggle a filter' });

            const options = Object.entries(filters).map(([key, value]) => ({
                label: value.name,
                value: key,
                emoji: value.emoji,
                default: enabledFilters.includes(key)
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('filter_select')
                .setPlaceholder('Select filters to toggle')
                .setMinValues(0)
                .setMaxValues(options.length)
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const response = await interaction.reply({ 
                embeds: [embed], 
                components: [row],
                fetchReply: true 
            });

            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async i => {
                const selectedFilters = i.values;
                
                // Disable all filters first
                await queue.filters.ffmpeg.setFilters(false);
                
                // Enable selected filters
                if (selectedFilters.length > 0) {
                    await queue.filters.ffmpeg.toggle(selectedFilters);
                }

                const newEnabled = queue.filters.ffmpeg.getFiltersEnabled();
                
                const updatedEmbed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🎛️ Filters Updated')
                    .setDescription(newEnabled.length > 0 
                        ? `**Active Filters:**\n${newEnabled.map(f => `• ${filters[f]?.emoji || '🎵'} ${filters[f]?.name || f}`).join('\n')}`
                        : 'All filters have been disabled.');

                await i.update({ embeds: [updatedEmbed], components: [] });
                collector.stop();
            });

            return;
        }

        if (filter === 'clear') {
            await queue.filters.ffmpeg.setFilters(false);
            
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('🎛️ Filters Cleared')
                        .setDescription('All audio filters have been disabled.')
                ]
            });
        }

        // Toggle specific filter
        await queue.filters.ffmpeg.toggle(filter);
        const isEnabled = queue.filters.ffmpeg.isEnabled(filter);

        const embed = new EmbedBuilder()
            .setColor(isEnabled ? 0x00ff00 : 0xff6b6b)
            .setTitle(`${filters[filter]?.emoji || '🎵'} ${filters[filter]?.name || filter}`)
            .setDescription(isEnabled ? '✅ Filter has been **enabled**!' : '❌ Filter has been **disabled**!')
            .setFooter({ 
                text: `Changed by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
