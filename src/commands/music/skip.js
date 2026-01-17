import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of songs to skip')
                .setMinValue(1)
                .setMaxValue(50)
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

        const memberChannel = interaction.member.voice.channel;
        const botChannel = queue.channel;

        if (!memberChannel || memberChannel.id !== botChannel.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ You need to be in the same voice channel as me!')
                ],
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount') || 1;
        const currentTrack = queue.currentTrack;

        if (amount > 1) {
            for (let i = 0; i < amount - 1; i++) {
                queue.node.skip();
            }
        }

        queue.node.skip();

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('⏭️ Skipped')
            .setDescription(amount > 1 
                ? `Skipped **${amount}** songs!` 
                : `Skipped **[${currentTrack.title}](${currentTrack.url})**`)
            .setThumbnail(currentTrack.thumbnail)
            .setFooter({ 
                text: `Skipped by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
