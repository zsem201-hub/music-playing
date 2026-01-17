import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the queue'),
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

        if (queue.tracks.size < 2) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffff00)
                        .setDescription('⚠️ Need at least 2 songs in the queue to shuffle!')
                ],
                ephemeral: true
            });
        }

        queue.tracks.shuffle();

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🔀 Queue Shuffled')
            .setDescription(`Shuffled **${queue.tracks.size}** songs in the queue!`)
            .setFooter({ 
                text: `Shuffled by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
