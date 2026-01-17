import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),
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

        if (queue.node.isPaused()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffff00)
                        .setDescription('⚠️ The music is already paused! Use `/resume` to continue.')
                ],
                ephemeral: true
            });
        }

        queue.node.pause();

        const embed = new EmbedBuilder()
            .setColor(0xffff00)
            .setTitle('⏸️ Music Paused')
            .setDescription(`Paused **[${queue.currentTrack.title}](${queue.currentTrack.url})**`)
            .setThumbnail(queue.currentTrack.thumbnail)
            .setFooter({ 
                text: `Paused by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
