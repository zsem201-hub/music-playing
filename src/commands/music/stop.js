import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
    cooldown: 3,

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
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

        queue.delete();

        const embed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('⏹️ Music Stopped')
            .setDescription('The music has been stopped and the queue has been cleared.')
            .setFooter({ 
                text: `Stopped by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
