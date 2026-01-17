import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),
    cooldown: 2,

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription('❌ No music in the queue!')
                ],
                ephemeral: true
            });
        }

        if (!queue.node.isPaused()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffff00)
                        .setDescription('⚠️ The music is not paused!')
                ],
                ephemeral: true
            });
        }

        queue.node.resume();

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('▶️ Music Resumed')
            .setDescription(`Resumed **[${queue.currentTrack.title}](${queue.currentTrack.url})**`)
            .setThumbnail(queue.currentTrack.thumbnail)
            .setFooter({ 
                text: `Resumed by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.reply({ embeds: [embed] });
    }
};
