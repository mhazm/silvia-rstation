const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
} = require('@discordjs/voice');

const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { ApplicationCommandOptionType } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');

// GLOBAL RADIO SESSION
global.radioSession ??= null;

module.exports = new ApplicationCommand({
    command: {
        name: 'radio',
        description: 'Memutar streaming radio',
        options: [
            {
                name: 'url',
                description: 'URL radio streaming',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'volume',
                description: 'Volume (1 - 100)',
                type: ApplicationCommandOptionType.Integer,
                required: false,
            },
        ],
    },

    run: async (client, interaction) => {
        const url = interaction.options.getString('url');
        const volume = interaction.options.getInteger('volume') ?? 50;
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({
                content: '❌ Masuk voice channel dulu',
                ephemeral: true,
            });
        }

        // STOP radio lama kalau ada
        if (global.radioSession) {
            global.radioSession.destroy();
            global.radioSession = null;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });

        let ffmpeg = null;
        let resource = null;
        let restarting = false;
        let currentVolume = volume;

        const startRadio = () => {
            if (ffmpeg) {
                try { ffmpeg.kill(); } catch {}
            }

            ffmpeg = spawn(ffmpegPath, [
                '-re',
                '-i', url,
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
                'pipe:1',
            ], { stdio: ['ignore', 'pipe', 'ignore'] });

            resource = createAudioResource(ffmpeg.stdout, {
                inputType: StreamType.Raw,
                inlineVolume: true,
            });

            resource.volume.setVolume(currentVolume / 100);
            player.play(resource);

            ffmpeg.on('exit', () => {
                if (restarting) return;
                restarting = true;
                console.warn('[RADIO] ffmpeg exited, restarting...');
                setTimeout(() => {
                    restarting = false;
                    startRadio();
                }, 3000);
            });
        };

        startRadio();
        connection.subscribe(player);

        // PLAYER IDLE RECOVERY
        player.on(AudioPlayerStatus.Idle, () => {
            if (restarting) return;
            restarting = true;
            console.warn('[RADIO] Player idle, restarting...');
            setTimeout(() => {
                restarting = false;
                startRadio();
            }, 3000);
        });

        // VOICE RECONNECT
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                console.warn('[RADIO] Voice disconnected, rejoining...');
                connection.rejoin();
            }
        });

        // SAVE GLOBAL SESSION
        global.radioSession = {
            connection,
            player,
            get volume() {
                return currentVolume;
            },
            setVolume: (v) => {
                currentVolume = v;
                if (resource?.volume) {
                    resource.volume.setVolume(v / 100);
                }
            },
            destroy: () => {
                try { ffmpeg?.kill(); } catch {}
                try { player.stop(); } catch {}
                try { connection.destroy(); } catch {}
            }
        };

        await interaction.reply(
            `📻 **Radio diputar!**\n🔊 Volume: **${currentVolume}%**\n🔗 ${url}`
        );
    },
}).toJSON();