import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),
    cooldown: 5,

    async execute(interaction) {
        const categories = {
            music: {
                emoji: '🎵',
                name: 'Music Commands',
                commands: [
                    { name: '/play', description: 'Play a song or playlist' },
                    { name: '/skip', description: 'Skip the current song' },
                    { name: '/stop', description: 'Stop music and clear queue' },
                    { name: '/pause', description: 'Pause the current song' },
                    { name: '/resume', description: 'Resume the paused song' },
                    { name: '/queue', description: 'View the music queue' },
                    { name: '/nowplaying', description: 'Show current song info' },
                    { name: '/volume', description: 'Adjust the volume' },
                    { name: '/loop', description: 'Set loop mode' },
                    { name: '/shuffle', description: 'Shuffle the queue' },
                    { name: '/seek', description: 'Seek to a position' },
                    { name: '/lyrics', description: 'Get song lyrics' },
                    { name: '/filter', description: 'Apply audio filters' }
                ]
            },
            utility: {
                emoji: '🔧',
                name: 'Utility Commands',
                commands: [
                    { name: '/help', description: 'Show this help menu' },
                    { name: '/ping', description: 'Check bot latency' }
                ]
            }
        };

        const mainEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🎵 Music Bot Help')
            .setDescription('Select a category below to view commands.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                Object.entries(categories).map(([key, cat]) => ({
                    name: `${cat.emoji} ${cat.name}`,
                    value: `${cat.commands.length} commands`,
                    inline: true
                }))
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('📂 Select a category')
            .addOptions(
                Object.entries(categories).map(([key, cat]) => ({
                    label: cat.name,
                    value: key,
                    emoji: cat.emoji,
                    description: `View ${cat.commands.length} commands`
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ 
            embeds: [mainEmbed], 
            components: [row],
            fetchReply: true 
        });

        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on('collect', async i => {
            const category = categories[i.values[0]];

            const categoryEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${category.emoji} ${category.name}`)
                .setDescription(
                    category.commands.map(cmd => `**${cmd.name}**\n└ ${cmd.description}`).join('\n\n')
                )
                .setFooter({ text: 'Use the menu to switch categories' });

            await i.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                selectMenu.setDisabled(true)
            );
            response.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};
