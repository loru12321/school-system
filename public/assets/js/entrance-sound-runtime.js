(() => {
    if (typeof window === 'undefined' || window.__ENTRANCE_SOUND_RUNTIME__) return;

    const STORAGE_KEY = 'SCHOOL_ENTRANCE_SOUND_V1';
    const CUSTOM_AUDIO_KEY = 'SCHOOL_ENTRANCE_SOUND_CUSTOM_AUDIO_V1';
    const CUSTOM_AUDIO_DB = 'SCHOOL_ENTRANCE_AUDIO_DB_V1';
    const CUSTOM_AUDIO_STORE = 'audio';
    const CUSTOM_AUDIO_ID = 'entrance';
    const BUILTIN_TRACKS = [
        { id: 'cinema-white', label: '映雪', src: './assets/audio/entrance/cinema-white.wav', fallback: 'silk' },
        { id: 'sweet-royal-switch', label: '清晖', src: './assets/audio/entrance/sweet-royal-switch.wav', fallback: 'signature' },
        { id: 'sister-aura', label: '云岫', src: './assets/audio/entrance/sister-aura.wav', fallback: 'runway' },
        { id: 'white-lace', label: '栀夏', src: './assets/audio/entrance/white-lace.wav', fallback: 'silk' },
        { id: 'red-violet', label: '绯云', src: './assets/audio/entrance/red-violet.wav', fallback: 'runway' },
        { id: 'midnight-silk', label: '月绡', src: './assets/audio/entrance/midnight-silk.wav', fallback: 'signature' },
        { id: 'bluegreen-flow', label: '青漪', src: './assets/audio/entrance/bluegreen-flow.wav', fallback: 'silk' },
        { id: 'beat-cut', label: '鹿鸣', src: './assets/audio/entrance/beat-cut.wav', fallback: 'runway' },
        { id: 'jiangnan-lantern', label: '南枝', src: './assets/audio/entrance/jiangnan-lantern.wav', fallback: 'silk' },
        { id: 'clean-denim', label: '风荷', src: './assets/audio/entrance/clean-denim.wav', fallback: 'signature' }
    ];
    const DEFAULT_MODE = 'random';
    const LEGACY_MODE_MAP = { signature: 'cinema-white', runway: 'beat-cut', silk: 'white-lace' };
    let lastOverlayVisible = true;
    let playedForSession = false;
    let customAudio = null;
    let customAudioUrl = '';
    let customAudioSource = '';
    let customAudioHydratePromise = null;
    let customAudioUnlocked = false;
    let unlockGestureBound = false;
    const builtInAudioCache = new Map();

    function getBuiltInTrack(mode) {
        return BUILTIN_TRACKS.find((track) => track.id === mode) || null;
    }

    function pickRandomTrack() {
        return BUILTIN_TRACKS[Math.floor(Math.random() * BUILTIN_TRACKS.length)] || BUILTIN_TRACKS[0];
    }

    function resolvePlaybackMode(mode) {
        if (mode === 'random') return pickRandomTrack().id;
        return mode;
    }

    function toast(message, type = 'info') {
        if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(message, type);
    }

    function readMode() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE;
            if (LEGACY_MODE_MAP[stored]) return LEGACY_MODE_MAP[stored];
            if (stored === 'random' || stored === 'off' || stored === 'custom' || getBuiltInTrack(stored)) return stored;
            return DEFAULT_MODE;
        } catch (_) {
            return DEFAULT_MODE;
        }
    }

    function writeMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (_) {}
    }

    function getAudioContext() {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return null;
        if (!window.__SCHOOL_ENTRANCE_AUDIO_CONTEXT__) {
            window.__SCHOOL_ENTRANCE_AUDIO_CONTEXT__ = new AudioContextCtor();
        }
        return window.__SCHOOL_ENTRANCE_AUDIO_CONTEXT__;
    }

    function playToneSequence(mode) {
        const ctx = getAudioContext();
        if (!ctx || mode === 'off') return;
        const fallbackMode = getBuiltInTrack(mode)?.fallback || LEGACY_MODE_MAP[mode] || mode;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(fallbackMode === 'runway' ? 0.11 : 0.08, now + 0.025);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.74);
        master.connect(ctx.destination);

        const patterns = {
            signature: [
                { f: 196, t: 0, d: 0.18, type: 'sine' },
                { f: 329.63, t: 0.10, d: 0.24, type: 'triangle' },
                { f: 493.88, t: 0.26, d: 0.34, type: 'sine' }
            ],
            runway: [
                { f: 146.83, t: 0, d: 0.09, type: 'square' },
                { f: 220, t: 0.14, d: 0.09, type: 'square' },
                { f: 293.66, t: 0.28, d: 0.12, type: 'triangle' },
                { f: 440, t: 0.42, d: 0.16, type: 'triangle' }
            ],
            silk: [
                { f: 261.63, t: 0, d: 0.28, type: 'sine' },
                { f: 392, t: 0.18, d: 0.34, type: 'sine' },
                { f: 523.25, t: 0.36, d: 0.28, type: 'triangle' }
            ]
        };

        (patterns[fallbackMode] || patterns.signature).forEach((note) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + note.t;
            const end = start + note.d;
            osc.type = note.type;
            osc.frequency.setValueAtTime(note.f, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.38, start + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, end);
            osc.connect(gain);
            gain.connect(master);
            osc.start(start);
            osc.stop(end + 0.02);
        });
    }

    function getBuiltInAudio(mode) {
        const track = getBuiltInTrack(mode);
        if (!track) return null;
        let audio = builtInAudioCache.get(track.id);
        if (!audio) {
            audio = new Audio(track.src);
            audio.preload = 'auto';
            audio.volume = 0.44;
            builtInAudioCache.set(track.id, audio);
        }
        return audio;
    }

    function prewarmBuiltInAudio() {
        const audio = getBuiltInAudio(readMode());
        if (audio) audio.load();
    }

    function openCustomAudioDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const request = indexedDB.open(CUSTOM_AUDIO_DB, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(CUSTOM_AUDIO_STORE)) db.createObjectStore(CUSTOM_AUDIO_STORE, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
        });
    }

    function storeCustomAudioFile(file) {
        return openCustomAudioDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readwrite');
            tx.objectStore(CUSTOM_AUDIO_STORE).put({
                id: CUSTOM_AUDIO_ID,
                blob: file,
                name: file.name || '',
                type: file.type || '',
                updatedAt: Date.now()
            });
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error || new Error('IndexedDB write failed'));
            };
        }));
    }

    function readStoredAudioFile() {
        return openCustomAudioDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readonly');
            const request = tx.objectStore(CUSTOM_AUDIO_STORE).get(CUSTOM_AUDIO_ID);
            request.onsuccess = () => resolve(request.result && request.result.blob ? request.result.blob : null);
            request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
            tx.oncomplete = () => db.close();
            tx.onerror = () => db.close();
        }));
    }

    function getCustomAudio() {
        let src = '';
        try {
            src = localStorage.getItem(CUSTOM_AUDIO_KEY) || '';
        } catch (_) {}
        if (!src) return Promise.resolve(null);
        if (src === 'indexeddb') {
            if (customAudio && customAudioSource === 'indexeddb') return Promise.resolve(customAudio);
            if (customAudioHydratePromise) return customAudioHydratePromise;
            customAudioHydratePromise = readStoredAudioFile().then((blob) => {
                customAudioHydratePromise = null;
                if (!blob) return null;
                if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
                customAudioUrl = URL.createObjectURL(blob);
                customAudio = new Audio(customAudioUrl);
                customAudioSource = 'indexeddb';
                customAudio.preload = 'auto';
                customAudio.volume = 0.42;
                customAudio.load();
                return customAudio;
            }).catch((error) => {
                customAudioHydratePromise = null;
                throw error;
            });
            return customAudioHydratePromise;
        }
        if (!customAudio || customAudio.src !== src || customAudioSource !== src) {
            customAudio = new Audio(src);
            customAudioSource = src;
            customAudio.preload = 'auto';
            customAudio.volume = 0.42;
        }
        return Promise.resolve(customAudio);
    }

    function resetCustomAudioCache() {
        customAudio = null;
        customAudioSource = '';
        customAudioUnlocked = false;
        customAudioHydratePromise = null;
        if (customAudioUrl) {
            URL.revokeObjectURL(customAudioUrl);
            customAudioUrl = '';
        }
    }

    function getImmediateCustomAudioFromFile(file) {
        resetCustomAudioCache();
        customAudioUrl = URL.createObjectURL(file);
        customAudio = new Audio(customAudioUrl);
        customAudioSource = 'indexeddb';
        customAudio.preload = 'auto';
        customAudio.volume = 0.42;
        customAudio.load();
        return customAudio;
    }

    function prewarmCustomAudio() {
        if (readMode() !== 'custom') return;
        getCustomAudio().catch(() => {});
    }

    function unlockCustomAudio() {
        if (customAudioUnlocked || readMode() !== 'custom') return;
        getCustomAudio().then((audio) => {
            if (!audio || customAudioUnlocked) return;
            const oldMuted = audio.muted;
            const oldVolume = audio.volume;
            audio.muted = true;
            audio.volume = 0;
            const playPromise = audio.play();
            if (!playPromise || typeof playPromise.then !== 'function') {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = oldMuted;
                audio.volume = oldVolume || 0.42;
                customAudioUnlocked = true;
                return;
            }
            playPromise.then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = oldMuted;
                audio.volume = oldVolume || 0.42;
                customAudioUnlocked = true;
            }).catch(() => {
                audio.muted = oldMuted;
                audio.volume = oldVolume || 0.42;
            });
        }).catch(() => {});
    }

    function bindUnlockGestures() {
        if (!unlockGestureBound) {
            unlockGestureBound = true;
            ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
                document.addEventListener(eventName, unlockCustomAudio, { passive: true });
            });
        }
        document.querySelectorAll('[data-login-submit]').forEach((button) => {
            if (button.dataset.soundUnlockBound === '1') return;
            button.dataset.soundUnlockBound = '1';
            button.addEventListener('pointerdown', unlockCustomAudio, { passive: true });
            button.addEventListener('click', unlockCustomAudio, { passive: true });
        });
    }

    function playEntranceSound(forceMode) {
        const selectedMode = forceMode || readMode();
        const mode = resolvePlaybackMode(selectedMode);
        if (mode === 'off') return;
        const builtInAudio = getBuiltInAudio(mode);
        if (builtInAudio) {
            builtInAudio.currentTime = 0;
            builtInAudio.play().catch(() => playToneSequence(mode));
            return;
        }
        if (mode === 'custom') {
            getCustomAudio().then((audio) => {
                if (!audio) {
                    playToneSequence(DEFAULT_MODE);
                    return;
                }
                audio.currentTime = 0;
                audio.play().catch(() => playToneSequence(DEFAULT_MODE));
            }).catch(() => playToneSequence(DEFAULT_MODE));
            return;
        }
        playToneSequence(mode);
    }

    function renderSoundChoices() {
        document.querySelectorAll('.entrance-sound-options').forEach((group) => {
            if (group.dataset.builtInRendered === '1') return;
            group.dataset.builtInRendered = '1';
            group.innerHTML = [
                '<button type="button" data-sound-choice="random">随机播放</button>',
                ...BUILTIN_TRACKS.map((track) => `<button type="button" data-sound-choice="${track.id}">${track.label}</button>`),
                '<button type="button" data-sound-choice="custom">本地音乐</button>',
                '<button type="button" data-sound-choice="off">关闭</button>'
            ].join('');
        });
    }

    function updateSoundButtons() {
        const mode = readMode();
        document.querySelectorAll('[data-sound-choice]').forEach((button) => {
            const active = button.dataset.soundChoice === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function bindControls() {
        renderSoundChoices();
        document.querySelectorAll('[data-sound-choice]').forEach((button) => {
            if (button.dataset.soundBound === '1') return;
            button.dataset.soundBound = '1';
            button.addEventListener('click', () => {
                const mode = button.dataset.soundChoice || DEFAULT_MODE;
                writeMode(mode);
                updateSoundButtons();
                prewarmBuiltInAudio();
                playEntranceSound(mode);
            });
        });

        document.querySelectorAll('[data-sound-preview]').forEach((button) => {
            if (button.dataset.soundBound === '1') return;
            button.dataset.soundBound = '1';
            button.addEventListener('click', () => playEntranceSound());
        });

        document.querySelectorAll('[data-sound-import]').forEach((input) => {
            if (input.dataset.soundBound === '1') return;
            input.dataset.soundBound = '1';
            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                if (!file) return;
                if (!/\.(mp3|wav|ogg|m4a)$/i.test(String(file.name || ''))) {
                    toast('请导入浏览器可播放的 MP3/WAV/OGG/M4A 音频', 'warning');
                    input.value = '';
                    return;
                }
                if (file.size > 24 * 1024 * 1024) {
                    toast('音频请控制在 24MB 以内', 'warning');
                    input.value = '';
                    return;
                }
                getImmediateCustomAudioFromFile(file);
                storeCustomAudioFile(file).then(() => {
                    try {
                        localStorage.setItem(CUSTOM_AUDIO_KEY, 'indexeddb');
                        localStorage.setItem(STORAGE_KEY, 'custom');
                    } catch (_) {}
                    updateSoundButtons();
                    playEntranceSound('custom');
                    toast('本机入场音乐已启用', 'success');
                }).catch(() => {
                    toast('本地音频保存失败，请换一个 MP3/WAV/OGG/M4A 文件', 'warning');
                });
            });
        });
        updateSoundButtons();
    }

    function polishLoginCopy() {
        const stage = document.querySelector('.login-clean-stage');
        if (stage) stage.dataset.mood = 'pure-campus';
        const title = document.querySelector('.login-clean-copy h1');
        const lead = document.querySelector('.login-clean-copy p');
        const eyebrow = document.querySelector('.login-clean-copy span');
        const strongs = document.querySelectorAll('.login-look-card strong');
        const labels = ['映雪', '鹿鸣', '青漪'];
        if (eyebrow) eyebrow.textContent = 'CLEAN / BEAT / FLOW';
        if (title) title.textContent = '菁莪云枢';
        if (lead) lead.textContent = '把成绩、师资、成长轨迹与家校报告按节拍排好：白底清透，粉色点睛，蓝绿色收尾；每一步都轻一点、准一点、看得更顺。';
        strongs.forEach((node, index) => {
            if (labels[index]) node.textContent = labels[index];
        });
    }

    function observeEntrance() {
        const overlay = document.getElementById('login-overlay');
        const visible = !!overlay && getComputedStyle(overlay).display !== 'none' && !overlay.classList.contains('hidden');
        if (lastOverlayVisible && !visible && !playedForSession) {
            playedForSession = true;
            window.setTimeout(() => playEntranceSound(), 120);
        }
        lastOverlayVisible = visible;
    }

    function boot() {
        bindControls();
        bindUnlockGestures();
        polishLoginCopy();
        prewarmBuiltInAudio();
        prewarmCustomAudio();
        observeEntrance();
        window.setInterval(() => {
            bindControls();
            bindUnlockGestures();
            polishLoginCopy();
            observeEntrance();
        }, 600);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.SchoolEntranceSound = {
        play: playEntranceSound,
        setMode(mode) {
            writeMode(mode);
            updateSoundButtons();
        },
        getMode: readMode
    };
    window.__ENTRANCE_SOUND_RUNTIME__ = true;
})();
