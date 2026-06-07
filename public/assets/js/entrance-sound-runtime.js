(() => {
    if (typeof window === 'undefined' || window.__ENTRANCE_SOUND_RUNTIME__) return;

    const STORAGE_KEY = 'SCHOOL_ENTRANCE_SOUND_V1';
    const CUSTOM_AUDIO_KEY = 'SCHOOL_ENTRANCE_SOUND_CUSTOM_AUDIO_V1';
    const CUSTOM_AUDIO_DB = 'SCHOOL_ENTRANCE_AUDIO_DB_V1';
    const CUSTOM_AUDIO_STORE = 'audio';
    const CUSTOM_AUDIO_ID = 'entrance';
    const DEFAULT_MODE = 'signature';
    let lastOverlayVisible = true;
    let playedForSession = false;
    let customAudio = null;
    let customAudioUrl = '';

    function toast(message, type = 'info') {
        if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(message, type);
    }

    function readMode() {
        try {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE;
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
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime + 0.02;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(mode === 'runway' ? 0.11 : 0.08, now + 0.025);
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

        (patterns[mode] || patterns.signature).forEach((note) => {
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
            return readStoredAudioFile().then((blob) => {
                if (!blob) return null;
                if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
                customAudioUrl = URL.createObjectURL(blob);
                customAudio = new Audio(customAudioUrl);
                customAudio.preload = 'auto';
                customAudio.volume = 0.42;
                return customAudio;
            });
        }
        if (!customAudio || customAudio.src !== src) {
            customAudio = new Audio(src);
            customAudio.preload = 'auto';
            customAudio.volume = 0.42;
        }
        return Promise.resolve(customAudio);
    }

    function playEntranceSound(forceMode) {
        const mode = forceMode || readMode();
        if (mode === 'off') return;
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

    function updateSoundButtons() {
        const mode = readMode();
        document.querySelectorAll('[data-sound-choice]').forEach((button) => {
            const active = button.dataset.soundChoice === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function bindControls() {
        document.querySelectorAll('[data-sound-choice]').forEach((button) => {
            if (button.dataset.soundBound === '1') return;
            button.dataset.soundBound = '1';
            button.addEventListener('click', () => {
                const mode = button.dataset.soundChoice || DEFAULT_MODE;
                writeMode(mode);
                updateSoundButtons();
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
                storeCustomAudioFile(file).then(() => {
                    try {
                        localStorage.setItem(CUSTOM_AUDIO_KEY, 'indexeddb');
                        localStorage.setItem(STORAGE_KEY, 'custom');
                    } catch (_) {}
                    customAudio = null;
                    if (customAudioUrl) {
                        URL.revokeObjectURL(customAudioUrl);
                        customAudioUrl = '';
                    }
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
        const labels = ['雪光白', '电影粉', '薄荷蓝'];
        if (eyebrow) eyebrow.textContent = 'PURE / CINEMA / LIGHT';
        if (title) title.textContent = '菁莪云枢';
        if (lead) lead.textContent = '像一场干净的午后电影，把成绩、师资与家校报告轻轻铺开；进入后少一点压迫感，多一点清透、自然和秩序。';
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
        polishLoginCopy();
        observeEntrance();
        window.setInterval(() => {
            bindControls();
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
