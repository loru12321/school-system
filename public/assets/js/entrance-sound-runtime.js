(() => {
    if (typeof window === 'undefined' || window.__ENTRANCE_SOUND_RUNTIME__) return;

    const STORAGE_KEY = 'SCHOOL_ENTRANCE_SOUND_V1';
    const CUSTOM_AUDIO_KEY = 'SCHOOL_ENTRANCE_SOUND_CUSTOM_AUDIO_V1';
    const CUSTOM_AUDIO_DB = 'SCHOOL_ENTRANCE_AUDIO_DB_V1';
    const CUSTOM_AUDIO_STORE = 'audio';
    const LEGACY_AUDIO_ID = 'entrance';
    const PLAYLIST_AUDIO_ID = 'authorized-playlist';
    const DEFAULT_MODE = 'custom';

    let lastOverlayVisible = true;
    let playedForSession = false;
    let playlist = [];
    let playlistHydratePromise = null;
    let activeAudio = null;
    let activeAudioUrl = '';
    let activeTrackIndex = -1;
    let lastRandomTrackIndex = -1;
    let autoAdvanceTimer = 0;
    let audioUnlocked = false;
    let unlockGestureBound = false;

    function toast(message, type = 'info') {
        if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(message, type);
    }

    function normalizeMode(mode) {
        if (mode === 'random' || mode === 'custom' || mode === 'off') return mode;
        return DEFAULT_MODE;
    }

    function readMode() {
        try {
            return normalizeMode(localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE);
        } catch (_) {
            return DEFAULT_MODE;
        }
    }

    function writeMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, normalizeMode(mode));
        } catch (_) {}
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

    function storeAuthorizedPlaylist(files) {
        const tracks = Array.from(files).map((file, index) => ({
            id: `authorized-${Date.now()}-${index}`,
            name: file.name || `Track ${index + 1}`,
            type: file.type || '',
            size: file.size || 0,
            blob: file,
            updatedAt: Date.now()
        }));
        return openCustomAudioDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readwrite');
            tx.objectStore(CUSTOM_AUDIO_STORE).put({ id: PLAYLIST_AUDIO_ID, tracks });
            tx.oncomplete = () => {
                db.close();
                resolve(tracks);
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error || new Error('IndexedDB write failed'));
            };
        }));
    }

    function readStoredPlaylist() {
        return openCustomAudioDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(CUSTOM_AUDIO_STORE, 'readonly');
            const store = tx.objectStore(CUSTOM_AUDIO_STORE);
            const playlistRequest = store.get(PLAYLIST_AUDIO_ID);
            playlistRequest.onsuccess = () => {
                const result = playlistRequest.result;
                if (result && Array.isArray(result.tracks) && result.tracks.length) {
                    resolve(result.tracks);
                    return;
                }
                const legacyRequest = store.get(LEGACY_AUDIO_ID);
                legacyRequest.onsuccess = () => {
                    const legacy = legacyRequest.result;
                    resolve(legacy && legacy.blob ? [{ id: 'legacy-authorized', name: legacy.name || 'Authorized audio', type: legacy.type || '', blob: legacy.blob }] : []);
                };
                legacyRequest.onerror = () => reject(legacyRequest.error || new Error('IndexedDB legacy read failed'));
            };
            playlistRequest.onerror = () => reject(playlistRequest.error || new Error('IndexedDB playlist read failed'));
            tx.oncomplete = () => db.close();
            tx.onerror = () => db.close();
        }));
    }

    function setPlaylist(tracks) {
        playlist = Array.isArray(tracks) ? tracks.filter((track) => track && track.blob) : [];
        if (activeTrackIndex >= playlist.length) activeTrackIndex = -1;
        updatePlaylistStatus();
    }

    function getPlaylist() {
        if (playlist.length) return Promise.resolve(playlist);
        if (playlistHydratePromise) return playlistHydratePromise;
        playlistHydratePromise = readStoredPlaylist().then((tracks) => {
            playlistHydratePromise = null;
            setPlaylist(tracks);
            return playlist;
        }).catch((error) => {
            playlistHydratePromise = null;
            throw error;
        });
        return playlistHydratePromise;
    }

    function stopActiveAudio() {
        if (autoAdvanceTimer) {
            window.clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = 0;
        }
        if (activeAudio) {
            activeAudio.onended = null;
            activeAudio.pause();
            activeAudio.currentTime = 0;
            activeAudio = null;
        }
        if (activeAudioUrl) {
            URL.revokeObjectURL(activeAudioUrl);
            activeAudioUrl = '';
        }
    }

    function pickRandomIndex(tracks) {
        if (tracks.length < 2) return 0;
        const pool = tracks.map((_, index) => index).filter((index) => index !== lastRandomTrackIndex);
        const picked = pool[Math.floor(Math.random() * pool.length)] || 0;
        lastRandomTrackIndex = picked;
        return picked;
    }

    function pickSequentialIndex(tracks) {
        if (!tracks.length) return -1;
        activeTrackIndex = activeTrackIndex < 0 ? 0 : (activeTrackIndex + 1) % tracks.length;
        return activeTrackIndex;
    }

    function playTrackAt(index, mode) {
        const track = playlist[index];
        if (!track || !track.blob) return false;
        stopActiveAudio();
        activeTrackIndex = index;
        activeAudioUrl = URL.createObjectURL(track.blob);
        activeAudio = new Audio(activeAudioUrl);
        activeAudio.preload = 'auto';
        activeAudio.volume = 0.46;
        activeAudio.onended = () => {
            const currentMode = readMode();
            if (currentMode === 'off') return;
            autoAdvanceTimer = window.setTimeout(() => playEntranceSound(currentMode === 'random' ? 'random' : 'custom'), 420);
        };
        activeAudio.play().catch(() => {
            toast('浏览器暂未允许自动播放，请点一次试听或登录按钮', 'warning');
        });
        updatePlaylistStatus(track.name, mode);
        return true;
    }

    function playEntranceSound(forceMode) {
        const selectedMode = normalizeMode(forceMode || readMode());
        if (selectedMode === 'off') {
            stopActiveAudio();
            return;
        }
        getPlaylist().then((tracks) => {
            if (!tracks.length) {
                stopActiveAudio();
                updatePlaylistStatus();
                return;
            }
            const index = selectedMode === 'random' ? pickRandomIndex(tracks) : pickSequentialIndex(tracks);
            playTrackAt(index, selectedMode);
        }).catch(() => {
            stopActiveAudio();
            toast('授权歌单读取失败，请重新导入音频文件', 'warning');
        });
    }

    function prewarmCustomAudio() {
        if (readMode() === 'off') return;
        getPlaylist().catch(() => {});
    }

    function unlockCustomAudio() {
        if (audioUnlocked || readMode() === 'off') return;
        getPlaylist().then((tracks) => {
            const track = tracks[0];
            if (!track || !track.blob || audioUnlocked) return;
            const url = URL.createObjectURL(track.blob);
            const probe = new Audio(url);
            probe.muted = true;
            probe.volume = 0;
            const playPromise = probe.play();
            if (!playPromise || typeof playPromise.then !== 'function') {
                probe.pause();
                URL.revokeObjectURL(url);
                audioUnlocked = true;
                return;
            }
            playPromise.then(() => {
                probe.pause();
                probe.currentTime = 0;
                URL.revokeObjectURL(url);
                audioUnlocked = true;
            }).catch(() => {
                URL.revokeObjectURL(url);
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

    function renderSoundChoices() {
        document.querySelectorAll('.entrance-sound-options').forEach((group) => {
            if (group.dataset.builtInRendered === '1') return;
            group.dataset.builtInRendered = '1';
            group.innerHTML = [
                '<button type="button" class="entrance-sound-option entrance-sound-option--utility" data-sound-choice="random"><strong>流动</strong><small>授权歌单随机</small></button>',
                '<button type="button" class="entrance-sound-option entrance-sound-option--utility" data-sound-choice="custom"><strong>私藏</strong><small>顺序播放</small></button>',
                '<button type="button" class="entrance-sound-option entrance-sound-option--utility" data-sound-choice="off"><strong>静音</strong><small>off</small></button>'
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

    function updatePlaylistStatus(activeName, mode) {
        document.querySelectorAll('[data-sound-status]').forEach((node) => {
            if (!playlist.length) {
                node.textContent = '未导入授权音乐';
                return;
            }
            const prefix = mode === 'random' ? '随机' : '顺序';
            node.textContent = activeName ? `${prefix}播放：${activeName}` : `已导入 ${playlist.length} 首授权音乐`;
        });
    }

    function validateAudioFiles(files) {
        const list = Array.from(files || []);
        if (!list.length) return [];
        const valid = [];
        for (const file of list) {
            if (!/\.(mp3|wav|ogg|m4a)$/i.test(String(file.name || ''))) {
                toast('请导入浏览器可播放的 MP3/WAV/OGG/M4A 音频', 'warning');
                return [];
            }
            if (file.size > 24 * 1024 * 1024) {
                toast('单个音频请控制在 24MB 以内', 'warning');
                return [];
            }
            valid.push(file);
        }
        return valid;
    }

    function bindControls() {
        renderSoundChoices();
        document.querySelectorAll('[data-sound-choice]').forEach((button) => {
            if (button.dataset.soundBound === '1') return;
            button.dataset.soundBound = '1';
            button.addEventListener('click', () => {
                const mode = normalizeMode(button.dataset.soundChoice || DEFAULT_MODE);
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
                const files = validateAudioFiles(input.files);
                if (!files.length) {
                    input.value = '';
                    return;
                }
                storeAuthorizedPlaylist(files).then((tracks) => {
                    setPlaylist(tracks);
                    try {
                        localStorage.setItem(CUSTOM_AUDIO_KEY, 'indexeddb');
                        localStorage.setItem(STORAGE_KEY, tracks.length > 1 ? 'random' : 'custom');
                    } catch (_) {}
                    audioUnlocked = false;
                    updateSoundButtons();
                    playEntranceSound(tracks.length > 1 ? 'random' : 'custom');
                    toast(`已启用 ${tracks.length} 首授权入场音乐`, 'success');
                }).catch(() => {
                    toast('本地音频保存失败，请换一组 MP3/WAV/OGG/M4A 文件', 'warning');
                });
            });
        });
        updateSoundButtons();
        getPlaylist().then(() => updatePlaylistStatus()).catch(() => updatePlaylistStatus());
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
