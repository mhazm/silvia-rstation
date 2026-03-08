const { ApplicationCommandOptionType } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');

module.exports = new ApplicationCommand({
	command: {
		name: 'radiostop',
		description: 'Menghentikan streaming radio',
		type: 1,
	},
	options: {
		allowedRoles: ['driver'],
		cooldown: 10000,
	},
	/**
	 *
	 * @param {DiscordBot} client
	 * @param {ChatInputCommandInteraction} interaction
	 */

	run: async (client, interaction) => {
		const player = client.lavalink.getPlayer(interaction.guild.id);

		if (!player) {
			return interaction.reply('❌ Tidak ada radio yang aktif');
		}

		player.destroy();
		interaction.reply('⏹️ Radio dihentikan');
	},
}).toJSON();
