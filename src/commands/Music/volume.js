const { ApplicationCommandOptionType } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');

module.exports = new ApplicationCommand({
  command: {
    name: 'volume',
    description: 'Mengatur volume radio',
    options: [
      {
        name: 'level',
        description: 'Volume 1 - 100',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
  },

  run: async (client, interaction) => {
    const level = interaction.options.getInteger('level');

    if (!global.radioSession) {
      return interaction.reply({
        content: '❌ Radio belum diputar',
        ephemeral: true,
      });
    }

    if (level < 1 || level > 100) {
      return interaction.reply({
        content: '❌ Volume harus 1 - 100',
        ephemeral: true,
      });
    }

    global.radioSession.setVolume(level);

    interaction.reply(`🔊 Volume diatur ke **${level}%**`);
  },
}).toJSON();