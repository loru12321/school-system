(() => {
    if (typeof window === 'undefined' || window.__ENTRANCE_SOUND_RUNTIME__) return;

    const STORAGE_KEY = 'SCHOOL_ENTRANCE_SOUND_V1';
    const CUSTOM_AUDIO_KEY = 'SCHOOL_ENTRANCE_SOUND_CUSTOM_AUDIO_V1';
    const DEFAULT_MODE = 'signature';
    let lastOverlayVisible = true;
    let playedForSession = false;
    let customAudio = null;

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

    function getCustomAudio() {
        try {
            const src = localStorage.getItem(CUSTOM_AUDIO_KEY);
            if (!src) return null;
            if (!customAudio || customAudio.src !== src) {
                customAudio = new Audio(src);
                customAudio.preload = 'auto';
                customAudio.volume = 0.42;
            }
            return customAudio;
        } catch (_) {
            return null;
        }
    }

    function playEntranceSound(forceMode) {
        const mode = forceMode || readMode();
        if (mode === 'off') return;
        if (mode === 'custom') {
            const audio = getCustomAudio();
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => playToneSequence(DEFAULT_MODE));
                return;
            }
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
                if (file.size > 900 * 1024) {
                    if (window.UI && typeof window.UI.toast === 'function') window.UI.toast('音频请控制在 900KB 以内', 'warning');
                    input.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        localStorage.setItem(CUSTOM_AUDIO_KEY, String(reader.result || ''));
                        localStorage.setItem(STORAGE_KEY, 'custom');
                    } catch (_) {}
                    customAudio = null;
                    updateSoundButtons();
                    playEntranceSound('custom');
                };
                reader.readAsDataURL(file);
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
