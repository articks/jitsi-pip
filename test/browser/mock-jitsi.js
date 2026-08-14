(() => {
    const definitions = [
        [ 'alice', 'Алиса', '#2563eb' ],
        [ 'bob', 'Борис', '#059669' ],
        [ 'carol', 'Карина', '#d97706' ],
        [ 'dave', 'Давид', '#7c3aed' ]
    ];
    const remote = new Map(definitions.map(([ id, name ]) => [ id, { id, name } ]));
    const tracks = new Map();
    let order = definitions.map(([ id ]) => id);
    let audioMuted = false;
    let videoMuted = false;
    const listeners = new Set();

    for (const [ id, name, color ] of definitions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 360;
        document.documentElement.appendChild(canvas);

        let frame = 0;
        const draw = () => {
            frame += 1;
            context.fillStyle = color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#fff';
            context.font = '700 64px system-ui';
            context.textAlign = 'center';
            context.fillText(name, 320, 170);
            context.font = '28px system-ui';
            context.fillText(`local test frame ${frame}`, 320, 230);
        };
        draw();
        setInterval(draw, 500);

        const stream = canvas.captureStream(2);
        tracks.set(id, {
            attach(video) {
                video.srcObject = stream;
                return video;
            },
            detach(video) {
                if (video.srcObject === stream) {
                    video.srcObject = null;
                }
            },
            getVideoType() {
                return 'camera';
            },
            isMuted() {
                return false;
            }
        });
    }

    const getState = () => ({
        'features/base/participants': {
            activeSpeakers: new Set(order.slice(1)),
            dominantSpeaker: order[0],
            remote
        },
        'features/base/tracks': order.map(id => ({
            jitsiTrack: tracks.get(id),
            local: false,
            mediaType: 'video',
            muted: false,
            participantId: id,
            videoType: 'camera'
        }))
    });

    window.APP = {
        API: {
            notifyToolbarButtonClicked(key, preventExecution) {
                console.info('[mock Jitsi API]', key, preventExecution);
            }
        },
        conference: {
            hangup() {
                console.info('[mock conference] hangup');
            },
            isJoined: () => true,
            isLocalAudioMuted: () => audioMuted,
            isLocalVideoMuted: () => videoMuted,
            toggleAudioMuted() {
                audioMuted = !audioMuted;
                listeners.forEach(listener => listener());
            },
            toggleVideoMuted() {
                videoMuted = !videoMuted;
                listeners.forEach(listener => listener());
            }
        },
        store: {
            getState,
            subscribe(listener) {
                listeners.add(listener);
                return () => listeners.delete(listener);
            }
        }
    };

    window.__mockJitsi = {
        participants: () => order.map(id => remote.get(id).name),
        rotateSpeaker() {
            order = [ ...order.slice(1), order[0] ];
            listeners.forEach(listener => listener());
        }
    };
})();
