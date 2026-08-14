(() => {
    const definitions = [
        [ 'alice', 'Алиса', '#2563eb' ],
        [ 'bob', 'Борис', '#059669' ],
        [ 'carol', 'Карина', '#d97706' ],
        [ 'dave', 'Давид', '#7c3aed' ]
    ];
    const localParticipant = { id: 'local', local: true, name: 'Вы' };
    const remote = new Map(definitions.map(([ id, name ]) => [ id, { id, name } ]));
    const tracks = new Map();
    let order = definitions.map(([ id ]) => id);
    let audioMuted = false;
    let screenShareActive = true;
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

    const screenCanvas = document.createElement('canvas');
    const screenContext = screenCanvas.getContext('2d');
    const screenSourceName = 'alice-desktop-1';

    screenCanvas.width = 1280;
    screenCanvas.height = 720;
    document.documentElement.appendChild(screenCanvas);
    remote.set(screenSourceName, {
        fakeParticipant: 'RemoteScreenShare',
        id: screenSourceName,
        name: 'Алиса'
    });

    let screenFrame = 0;
    const drawScreen = () => {
        screenFrame += 1;
        screenContext.fillStyle = '#f8fafc';
        screenContext.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
        screenContext.fillStyle = '#0f172a';
        screenContext.fillRect(60, 50, 1160, 90);
        screenContext.fillStyle = '#fff';
        screenContext.font = '700 42px system-ui';
        screenContext.textAlign = 'left';
        screenContext.fillText('Демонстрация экрана — локальный тест', 95, 108);
        screenContext.fillStyle = '#1e293b';
        screenContext.font = '32px system-ui';
        screenContext.fillText(`Обновление кадра: ${screenFrame}`, 95, 220);
        screenContext.fillStyle = '#dbeafe';
        screenContext.fillRect(95, 270, 500, 300);
        screenContext.fillStyle = '#dcfce7';
        screenContext.fillRect(645, 270, 480, 300);
    };

    drawScreen();
    setInterval(drawScreen, 700);
    const screenStream = screenCanvas.captureStream(2);
    const screenTrack = {
        attach(video) {
            video.srcObject = screenStream;
            return video;
        },
        detach(video) {
            if (video.srcObject === screenStream) {
                video.srcObject = null;
            }
        },
        getSourceName() {
            return screenSourceName;
        },
        getVideoType() {
            return 'desktop';
        },
        isMuted() {
            return !screenShareActive;
        }
    };

    const getState = () => ({
        'features/base/participants': {
            activeSpeakers: new Set(order.slice(1)),
            dominantSpeaker: order[0],
            local: localParticipant,
            remote
        },
        'features/base/tracks': [
            ...order.map(id => ({
                jitsiTrack: tracks.get(id),
                local: false,
                mediaType: 'video',
                muted: false,
                participantId: id,
                videoType: 'camera'
            })),
            ...(screenShareActive ? [ {
                jitsiTrack: screenTrack,
                local: false,
                mediaType: 'video',
                muted: false,
                participantId: 'alice',
                videoType: 'desktop'
            } ] : [])
        ],
        'features/large-video': {
            participantId: screenShareActive ? screenSourceName : order[0]
        },
        'features/video-layout': {
            remoteScreenShares: screenShareActive ? [ screenSourceName ] : []
        }
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
        participants: () => [ localParticipant.name, ...order.map(id => remote.get(id).name) ],
        rotateSpeaker() {
            order = [ ...order.slice(1), order[0] ];
            listeners.forEach(listener => listener());
        },
        toggleScreenShare() {
            screenShareActive = !screenShareActive;
            listeners.forEach(listener => listener());
        }
    };
})();
