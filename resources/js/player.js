class HannaMusicPlayer {
    constructor() {
        this.primaryAudio = document.querySelector('[data-audio-element]');
        this.trackButtons = Array.from(
            document.querySelectorAll('[data-player-track]')
        );
        this.playlistButtons = Array.from(
            document.querySelectorAll('[data-playlist-start]')
        );

        this.startAllButton = document.querySelector('[data-player-start-all]');
        this.toggleButton = document.querySelector('[data-player-toggle]');
        this.previousButton = document.querySelector('[data-player-previous]');
        this.nextButton = document.querySelector('[data-player-next]');
        this.shuffleButton = document.querySelector('[data-player-shuffle]');
        this.repeatOneButton = document.querySelector('[data-player-repeat-one]');
        this.progressInput = document.querySelector('[data-player-progress]');
        this.volumeInput = document.querySelector('[data-player-volume]');
        this.muteButton = document.querySelector('[data-player-mute]');
        this.volumeIcon = document.querySelector('[data-player-volume-icon]');
        this.volumeValue = document.querySelector('[data-player-volume-value]');
        this.playerTitle = document.querySelector('[data-player-title]');
        this.playerSubtitle = document.querySelector('[data-player-subtitle]');
        this.playerCover = document.querySelector('[data-player-cover]');
        this.playerCoverFallback = document.querySelector(
            '[data-player-cover-fallback]'
        );
        this.currentTimeElement = document.querySelector(
            '[data-player-current-time]'
        );
        this.durationElement = document.querySelector('[data-player-duration]');
        this.playIcon = document.querySelector('[data-player-play-icon]');
        this.pauseIcon = document.querySelector('[data-player-pause-icon]');
        this.crossfadeLabel = document.querySelector('[data-player-crossfade-label]');

        this.tracks = this.trackButtons.map((button, index) => ({
            index,
            id: String(button.dataset.trackId || index),
            title: button.dataset.title || 'بدون عنوان',
            audioUrl: button.dataset.audioUrl || '',
            coverUrl: button.dataset.coverUrl || '',
        }));

        this.indexByTrackId = new Map(
            this.tracks.map((track) => [track.id, track.index])
        );
        this.allTracksQueue = this.tracks.map((track) => track.index);
        this.orderedQueue = [...this.allTracksQueue];
        this.queue = [...this.allTracksQueue];
        this.queuePosition = -1;
        this.currentTrackIndex = -1;
        this.currentContextName = 'همه آهنگ‌ها';

        this.crossfadeSeconds = Math.max(
            0,
            Number(this.primaryAudio?.dataset.crossfadeSeconds || 5)
        );
        this.activeSlot = 0;
        this.audioContext = null;
        this.gainNodes = [];
        this.transitionToken = 0;
        this.isTransitioning = false;
        this.autoTransitionTriggered = false;
        this.masterVolume = 0.8;
        this.lastNonZeroVolume = 0.8;
        this.muted = false;
        this.shuffleEnabled = false;
        this.repeatOneEnabled = false;

        if (!this.primaryAudio || !this.toggleButton) {
            return;
        }

        const secondaryAudio = this.primaryAudio.cloneNode(false);
        secondaryAudio.removeAttribute('data-audio-element');
        secondaryAudio.dataset.audioSecondary = 'true';
        secondaryAudio.setAttribute('aria-hidden', 'true');
        this.primaryAudio.after(secondaryAudio);
        this.audios = [this.primaryAudio, secondaryAudio];

        this.prepareAudioElements();
        this.restorePreferences();
        this.applyQueueMode(this.currentTrackIndex);
        this.bindEvents();
        this.updateModeUi();
        this.updateDisabledState();
        this.updateCrossfadeLabel();
    }

    prepareAudioElements() {
        this.audios.forEach((audio) => {
            audio.setAttribute('playsinline', '');
            audio.setAttribute('webkit-playsinline', '');
            audio.preload = 'metadata';
            audio.volume = this.masterVolume;
        });
    }

    bindEvents() {
        this.startAllButton?.addEventListener('click', () => {
            const firstTrack = this.allTracksQueue[0];

            if (!Number.isInteger(firstTrack)) {
                return;
            }

            this.currentContextName = 'همه آهنگ‌ها';
            this.setQueue(this.allTracksQueue, firstTrack);
            void this.loadTrack(firstTrack, true, true);
        });

        this.trackButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.currentContextName = 'همه آهنگ‌ها';
                this.setQueue(this.allTracksQueue, index);

                if (this.currentTrackIndex === index) {
                    void this.toggle();
                    return;
                }

                void this.loadTrack(index, true, true);
            });
        });

        this.playlistButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const ids = this.parseTrackIds(button.dataset.playlistTrackIds);
                const queue = ids
                    .map((id) => this.indexByTrackId.get(String(id)))
                    .filter(Number.isInteger);
                const firstTrack = queue[0];

                if (!Number.isInteger(firstTrack)) {
                    return;
                }

                this.currentContextName =
                    button.dataset.playlistName || 'پلی‌لیست';
                this.setQueue(queue, firstTrack);
                void this.loadTrack(firstTrack, true, true);
            });
        });

        this.toggleButton.addEventListener('click', () => {
            void this.toggle();
        });

        this.previousButton?.addEventListener('click', () => {
            void this.previous();
        });

        this.nextButton?.addEventListener('click', () => {
            void this.next(false);
        });

        this.shuffleButton?.addEventListener('click', () => {
            this.toggleShuffle();
        });

        this.repeatOneButton?.addEventListener('click', () => {
            this.repeatOneEnabled = !this.repeatOneEnabled;
            this.persistPreference('hanna-player-repeat-one', this.repeatOneEnabled);
            this.updateModeUi();
        });

        this.audios.forEach((audio, slot) => {
            audio.addEventListener('play', () => {
                if (slot === this.activeSlot) {
                    this.updatePlayingState(true);
                }
            });

            audio.addEventListener('pause', () => {
                if (slot === this.activeSlot && !this.isTransitioning) {
                    this.updatePlayingState(false);
                }
            });

            audio.addEventListener('ended', () => {
                if (slot !== this.activeSlot || this.isTransitioning) {
                    return;
                }

                void this.next(true, false);
            });

            audio.addEventListener('loadedmetadata', () => {
                if (slot !== this.activeSlot) {
                    return;
                }

                this.updateDuration();
                this.updateMediaPositionState();
            });

            audio.addEventListener('timeupdate', () => {
                if (slot !== this.activeSlot) {
                    return;
                }

                this.updateProgress();
                this.updateMediaPositionState();
                this.maybeStartAutomaticCrossfade();
            });

            audio.addEventListener('error', () => {
                if (slot === this.activeSlot) {
                    this.handleAudioError(audio);
                }
            });
        });

        this.progressInput?.addEventListener('input', () => {
            const audio = this.currentAudio();

            if (!Number.isFinite(audio.duration)) {
                return;
            }

            const ratio = Number(this.progressInput.value) / 1000;
            audio.currentTime = ratio * audio.duration;
            this.autoTransitionTriggered = false;
        });

        this.volumeInput?.addEventListener('input', () => {
            const volume = Math.min(
                1,
                Math.max(0, Number(this.volumeInput.value) / 100)
            );

            this.setVolume(volume, true);
        });

        this.muteButton?.addEventListener('click', () => {
            this.toggleMute();
        });

        this.bindMediaSession();
    }

    currentAudio() {
        return this.audios[this.activeSlot];
    }

    inactiveSlot() {
        return this.activeSlot === 0 ? 1 : 0;
    }

    setQueue(queue, currentTrackIndex) {
        this.orderedQueue = Array.from(
            new Set(
                queue.filter(
                    (index) =>
                        Number.isInteger(index) &&
                        index >= 0 &&
                        index < this.tracks.length
                )
            )
        );

        this.applyQueueMode(currentTrackIndex);
    }

    applyQueueMode(currentTrackIndex = this.currentTrackIndex) {
        const hasCurrentTrack =
            Number.isInteger(currentTrackIndex) &&
            this.orderedQueue.includes(currentTrackIndex);

        if (this.shuffleEnabled && this.orderedQueue.length > 1) {
            const remaining = this.orderedQueue.filter(
                (index) => index !== currentTrackIndex
            );

            this.queue = hasCurrentTrack
                ? [currentTrackIndex, ...this.shuffle(remaining)]
                : this.shuffle([...this.orderedQueue]);
        } else {
            this.queue = [...this.orderedQueue];
        }

        this.queuePosition = this.queue.indexOf(currentTrackIndex);

        if (this.queuePosition === -1 && this.queue.length > 0) {
            this.queuePosition = 0;
        }
    }

    toggleShuffle() {
        this.shuffleEnabled = !this.shuffleEnabled;
        this.applyQueueMode(this.currentTrackIndex);
        this.persistPreference('hanna-player-shuffle', this.shuffleEnabled);
        this.updateModeUi();
    }

    shuffle(items) {
        for (let index = items.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
        }

        return items;
    }

    async loadTrack(index, autoplay = true, allowCrossfade = false) {
        const track = this.tracks[index];

        if (!track?.audioUrl) {
            this.showPlayerMessage(
                'خطا در پخش آهنگ',
                'آدرس فایل آهنگ معتبر نیست'
            );
            return;
        }

        const currentAudio = this.currentAudio();
        const canCrossfade =
            allowCrossfade &&
            this.currentTrackIndex >= 0 &&
            !currentAudio.paused &&
            this.crossfadeSeconds > 0;

        if (canCrossfade) {
            await this.crossfadeTo(index);
            return;
        }

        await this.loadDirect(index, autoplay);
    }

    async loadDirect(index, autoplay = true) {
        const track = this.tracks[index];
        this.cancelTransition();

        const activeAudio = this.currentAudio();
        const inactiveAudio = this.audios[this.inactiveSlot()];

        inactiveAudio.pause();
        inactiveAudio.removeAttribute('src');
        inactiveAudio.load();
        this.setSlotLevel(this.inactiveSlot(), 0);

        activeAudio.pause();
        activeAudio.src = track.audioUrl;
        activeAudio.preload = 'auto';
        activeAudio.load();
        this.setSlotLevel(this.activeSlot, 1);

        this.commitTrack(index);

        if (autoplay) {
            await this.play();
        }
    }

    async crossfadeTo(index) {
        if (this.isTransitioning) {
            return;
        }

        const track = this.tracks[index];
        const outgoingSlot = this.activeSlot;
        const incomingSlot = this.inactiveSlot();
        const outgoingAudio = this.audios[outgoingSlot];
        const incomingAudio = this.audios[incomingSlot];
        const token = ++this.transitionToken;

        this.isTransitioning = true;
        this.autoTransitionTriggered = true;

        try {
            await this.ensureAudioEngine();

            incomingAudio.pause();
            incomingAudio.src = track.audioUrl;
            incomingAudio.currentTime = 0;
            incomingAudio.preload = 'auto';
            incomingAudio.load();
            this.setSlotLevel(incomingSlot, 0);

            await incomingAudio.play();

            if (token !== this.transitionToken) {
                incomingAudio.pause();
                return;
            }

            this.activeSlot = incomingSlot;
            this.commitTrack(index);
            this.updatePlayingState(true);

            const duration = this.effectiveCrossfadeDuration(outgoingAudio);
            const startedAt = performance.now();

            await new Promise((resolve) => {
                const frame = (timestamp) => {
                    if (token !== this.transitionToken) {
                        resolve();
                        return;
                    }

                    const progress = Math.min(
                        1,
                        (timestamp - startedAt) / (duration * 1000)
                    );
                    const outgoingLevel = Math.cos(progress * Math.PI * 0.5);
                    const incomingLevel = Math.sin(progress * Math.PI * 0.5);

                    this.setSlotLevel(outgoingSlot, outgoingLevel);
                    this.setSlotLevel(incomingSlot, incomingLevel);

                    if (progress < 1) {
                        requestAnimationFrame(frame);
                    } else {
                        resolve();
                    }
                };

                requestAnimationFrame(frame);
            });

            if (token !== this.transitionToken) {
                return;
            }

            outgoingAudio.pause();
            outgoingAudio.removeAttribute('src');
            outgoingAudio.load();
            this.setSlotLevel(outgoingSlot, 0);
            this.setSlotLevel(incomingSlot, 1);
        } catch (error) {
            console.error('Crossfade error:', error);

            this.activeSlot = outgoingSlot;
            incomingAudio.pause();
            incomingAudio.removeAttribute('src');
            incomingAudio.load();
            this.setSlotLevel(incomingSlot, 0);
            this.setSlotLevel(outgoingSlot, 1);

            if (outgoingAudio.paused) {
                await this.loadDirect(index, true);
            }
        } finally {
            if (token === this.transitionToken) {
                this.isTransitioning = false;
            }
        }
    }

    effectiveCrossfadeDuration(outgoingAudio) {
        if (
            !Number.isFinite(outgoingAudio.duration) ||
            !Number.isFinite(outgoingAudio.currentTime)
        ) {
            return Math.max(0.2, this.crossfadeSeconds);
        }

        const remaining = Math.max(
            0.2,
            outgoingAudio.duration - outgoingAudio.currentTime
        );

        return Math.max(0.2, Math.min(this.crossfadeSeconds, remaining));
    }

    commitTrack(index) {
        const track = this.tracks[index];
        this.currentTrackIndex = index;
        this.autoTransitionTriggered = false;

        const queuePosition = this.queue.indexOf(index);
        if (queuePosition >= 0) {
            this.queuePosition = queuePosition;
        }

        this.resetProgress();
        this.updateTrackInformation(track);
        this.updateActiveTrack();
        this.updateMediaMetadata(track);
    }

    async play() {
        if (this.tracks.length === 0) {
            return;
        }

        if (this.currentTrackIndex < 0 || !this.currentAudio().getAttribute('src')) {
            const firstTrack = this.queue[0] ?? this.allTracksQueue[0];

            if (!Number.isInteger(firstTrack)) {
                return;
            }

            await this.loadDirect(firstTrack, false);
        }

        try {
            await this.ensureAudioEngine();
            await this.currentAudio().play();
            this.updatePlayingState(true);
        } catch (error) {
            console.error('Audio play error:', error);
            this.updatePlayingState(false);

            const message =
                error?.name === 'NotAllowedError'
                    ? 'برای شروع پخش دوباره روی دکمه بزن'
                    : 'فایل صوتی یا فرمت آن روی این مرورگر قابل پخش نیست';

            this.showPlayerMessage('پخش انجام نشد', message);
        }
    }

    pause() {
        this.cancelTransition();
        this.audios.forEach((audio, slot) => {
            audio.pause();
            this.setSlotLevel(slot, slot === this.activeSlot ? 1 : 0);
        });
        this.updatePlayingState(false);
    }

    async toggle() {
        if (this.tracks.length === 0) {
            return;
        }

        if (this.currentTrackIndex < 0 || !this.currentAudio().getAttribute('src')) {
            const firstTrack = this.queue[0] ?? this.allTracksQueue[0];

            if (Number.isInteger(firstTrack)) {
                await this.loadDirect(firstTrack, true);
            }

            return;
        }

        if (this.currentAudio().paused) {
            await this.play();
        } else {
            this.pause();
        }
    }

    async next(automatic = false, allowCrossfade = true) {
        if (this.queue.length === 0 || this.isTransitioning) {
            return;
        }

        const nextIndex = this.nextTrackIndex();

        if (!Number.isInteger(nextIndex)) {
            return;
        }

        await this.loadTrack(
            nextIndex,
            true,
            allowCrossfade && !this.currentAudio().paused
        );

        if (!automatic) {
            this.autoTransitionTriggered = false;
        }
    }

    nextTrackIndex() {
        if (this.repeatOneEnabled && this.currentTrackIndex >= 0) {
            return this.currentTrackIndex;
        }

        this.queuePosition =
            (this.queuePosition + 1 + this.queue.length) % this.queue.length;

        return this.queue[this.queuePosition];
    }

    async previous() {
        if (this.queue.length === 0 || this.isTransitioning) {
            return;
        }

        const audio = this.currentAudio();

        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            this.autoTransitionTriggered = false;
            return;
        }

        this.queuePosition =
            (this.queuePosition - 1 + this.queue.length) % this.queue.length;

        await this.loadTrack(
            this.queue[this.queuePosition],
            true,
            !audio.paused
        );
    }

    maybeStartAutomaticCrossfade() {
        const audio = this.currentAudio();

        if (
            this.autoTransitionTriggered ||
            this.isTransitioning ||
            audio.paused ||
            this.queue.length === 0 ||
            !Number.isFinite(audio.duration) ||
            audio.duration <= 0
        ) {
            return;
        }

        const fadeWindow = Math.min(
            this.crossfadeSeconds,
            Math.max(0.5, audio.duration / 3)
        );
        const remaining = audio.duration - audio.currentTime;

        if (this.crossfadeSeconds > 0 && remaining <= fadeWindow) {
            this.autoTransitionTriggered = true;
            void this.next(true, true);
        }
    }

    updateTrackInformation(track) {
        if (this.playerTitle) {
            this.playerTitle.textContent = track.title;
        }

        if (this.playerSubtitle) {
            this.playerSubtitle.textContent = this.currentContextName;
        }

        this.updateCover(track);
    }

    updateCover(track) {
        if (!this.playerCover) {
            return;
        }

        if (track.coverUrl) {
            this.playerCover.src = track.coverUrl;
            this.playerCover.alt = track.title;
            this.playerCover.classList.remove('hidden');
            this.playerCoverFallback?.classList.add('hidden');
            return;
        }

        this.playerCover.removeAttribute('src');
        this.playerCover.alt = '';
        this.playerCover.classList.add('hidden');
        this.playerCoverFallback?.classList.remove('hidden');
    }

    resetProgress() {
        if (this.currentTimeElement) {
            this.currentTimeElement.textContent = '0:00';
        }

        if (this.durationElement) {
            this.durationElement.textContent = '0:00';
        }

        if (this.progressInput) {
            this.progressInput.value = '0';
        }
    }

    updateDuration() {
        if (this.durationElement) {
            this.durationElement.textContent = this.formatTime(
                this.currentAudio().duration
            );
        }
    }

    updateProgress() {
        const audio = this.currentAudio();

        if (this.currentTimeElement) {
            this.currentTimeElement.textContent = this.formatTime(
                audio.currentTime
            );
        }

        if (
            !this.progressInput ||
            !Number.isFinite(audio.duration) ||
            audio.duration <= 0
        ) {
            return;
        }

        const progress = audio.currentTime / audio.duration;
        this.progressInput.value = String(Math.round(progress * 1000));
    }

    updatePlayingState(isPlaying) {
        this.playIcon?.classList.toggle('hidden', isPlaying);
        this.pauseIcon?.classList.toggle('hidden', !isPlaying);

        this.toggleButton?.setAttribute(
            'aria-label',
            isPlaying ? 'توقف آهنگ' : 'پخش آهنگ'
        );

        this.trackButtons.forEach((button, index) => {
            const icon = button.querySelector('[data-track-icon]');

            if (icon) {
                icon.textContent =
                    index === this.currentTrackIndex && isPlaying ? '❚❚' : '▶';
            }
        });

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying
                ? 'playing'
                : 'paused';
        }
    }

    updateActiveTrack() {
        this.trackButtons.forEach((button, index) => {
            const active = index === this.currentTrackIndex;
            button.classList.toggle('track-play-button-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');

            const row = document.querySelector(
                `[data-track-row="${this.tracks[index].id}"]`
            );
            row?.classList.toggle('track-row-active', active);
        });
    }

    updateModeUi() {
        this.updateModeButton(
            this.shuffleButton,
            this.shuffleEnabled,
            'پخش تصادفی فعال است',
            'فعال‌کردن پخش تصادفی'
        );
        this.updateModeButton(
            this.repeatOneButton,
            this.repeatOneEnabled,
            'فقط همین آهنگ تکرار می‌شود',
            'تکرار فقط همین آهنگ'
        );
    }

    updateModeButton(button, active, activeLabel, inactiveLabel) {
        if (!button) {
            return;
        }

        button.classList.toggle('player-mode-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.setAttribute('aria-label', active ? activeLabel : inactiveLabel);
        button.title = active ? activeLabel : inactiveLabel;
    }

    updateCrossfadeLabel() {
        if (this.crossfadeLabel) {
            this.crossfadeLabel.textContent = this.crossfadeSeconds > 0
                ? `فید ${this.crossfadeSeconds} ثانیه‌ای`
                : 'فید خاموش';
        }
    }

    handleAudioError(audio) {
        const code = audio?.error?.code;
        const details = {
            1: 'بارگیری آهنگ لغو شد',
            2: 'دریافت فایل آهنگ با خطا روبه‌رو شد',
            3: 'فایل آهنگ قابل رمزگشایی نیست',
            4: 'فرمت فایل روی این مرورگر پشتیبانی نمی‌شود',
        };

        this.updatePlayingState(false);
        this.showPlayerMessage(
            'خطا در پخش آهنگ',
            details[code] || 'فایل آهنگ در دسترس نیست'
        );
    }

    showPlayerMessage(title, subtitle) {
        if (this.playerTitle) {
            this.playerTitle.textContent = title;
        }

        if (this.playerSubtitle) {
            this.playerSubtitle.textContent = subtitle;
        }
    }

    restorePreferences() {
        let volume = 0.8;

        try {
            const storedVolume = Number(
                localStorage.getItem('hanna-player-volume')
            );

            if (Number.isFinite(storedVolume)) {
                volume = Math.min(1, Math.max(0, storedVolume));
            }

            this.shuffleEnabled =
                localStorage.getItem('hanna-player-shuffle') === 'true';
            this.repeatOneEnabled =
                localStorage.getItem('hanna-player-repeat-one') === 'true';
        } catch {
            // Local storage may be unavailable.
        }

        this.masterVolume = volume;
        this.muted = volume === 0;

        if (volume > 0) {
            this.lastNonZeroVolume = volume;
        }

        this.applyMasterVolume();
        this.updateVolumeUi();
    }

    setVolume(volume, persist = false) {
        const normalizedVolume = Math.min(
            1,
            Math.max(0, Number(volume) || 0)
        );

        this.masterVolume = normalizedVolume;
        this.muted = normalizedVolume === 0;

        if (normalizedVolume > 0) {
            this.lastNonZeroVolume = normalizedVolume;
        }

        this.applyMasterVolume();

        if (persist) {
            this.persistPreference('hanna-player-volume', normalizedVolume);
        }

        this.updateVolumeUi();
    }

    toggleMute() {
        if (this.muted || this.masterVolume === 0) {
            this.masterVolume = this.lastNonZeroVolume > 0
                ? this.lastNonZeroVolume
                : 0.8;
            this.muted = false;
        } else {
            this.lastNonZeroVolume = this.masterVolume;
            this.muted = true;
        }

        this.applyMasterVolume();
        this.persistPreference(
            'hanna-player-volume',
            this.muted ? 0 : this.masterVolume
        );
        this.updateVolumeUi();
    }

    applyMasterVolume() {
        this.audios.forEach((audio, slot) => {
            const isActive = slot === this.activeSlot;
            this.setSlotLevel(slot, isActive ? 1 : 0);
            audio.muted = false;
        });
    }

    setSlotLevel(slot, level) {
        const normalizedLevel = Math.min(1, Math.max(0, level));
        const volume = this.muted ? 0 : this.masterVolume * normalizedLevel;

        if (this.gainNodes[slot]) {
            this.gainNodes[slot].gain.value = volume;
            return;
        }

        try {
            this.audios[slot].volume = volume;
        } catch {
            // Some mobile browsers keep output volume at system level.
        }
    }

    updateVolumeUi() {
        const effectiveVolume = this.muted ? 0 : this.masterVolume;
        const percentage = Math.round(effectiveVolume * 100);

        if (this.volumeInput) {
            this.volumeInput.value = String(percentage);
            this.volumeInput.setAttribute('aria-valuetext', `${percentage} درصد`);
        }

        if (this.volumeValue) {
            this.volumeValue.textContent = `${percentage}%`;
        }

        if (this.volumeIcon) {
            this.volumeIcon.textContent =
                percentage === 0 ? '🔇' : percentage < 50 ? '🔉' : '🔊';
        }

        this.muteButton?.setAttribute(
            'aria-label',
            percentage === 0 ? 'وصل‌کردن صدا' : 'قطع صدا'
        );
    }

    async ensureAudioEngine() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return;
        }

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            this.applyMasterVolume();
            return;
        }

        try {
            this.audioContext = new AudioContextClass();
            this.gainNodes = this.audios.map((audio, slot) => {
                const source = this.audioContext.createMediaElementSource(audio);
                const gain = this.audioContext.createGain();
                source.connect(gain).connect(this.audioContext.destination);
                gain.gain.value = slot === this.activeSlot
                    ? this.masterVolume
                    : 0;
                audio.volume = 1;
                return gain;
            });

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.applyMasterVolume();
        } catch (error) {
            console.warn('Web Audio is unavailable; using volume fallback.', error);
            this.audioContext = null;
            this.gainNodes = [];
            this.applyMasterVolume();
        }
    }

    cancelTransition() {
        this.transitionToken += 1;
        this.isTransitioning = false;
    }

    persistPreference(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch {
            // Local storage may be unavailable.
        }
    }

    updateDisabledState() {
        const disabled = this.tracks.length === 0;

        [
            this.startAllButton,
            this.toggleButton,
            this.previousButton,
            this.nextButton,
            this.shuffleButton,
            this.repeatOneButton,
            this.progressInput,
            this.volumeInput,
            this.muteButton,
        ].forEach((element) => {
            if (element) {
                element.disabled = disabled;
            }
        });
    }

    parseTrackIds(value) {
        if (!value) {
            return [];
        }

        try {
            const result = JSON.parse(value);
            return Array.isArray(result) ? result : [];
        } catch {
            return [];
        }
    }

    formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return '0:00';
        }

        const total = Math.floor(seconds);
        const minutes = Math.floor(total / 60);
        const remainingSeconds = total % 60;

        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    updateMediaMetadata(track) {
        if (
            !('mediaSession' in navigator) ||
            typeof MediaMetadata === 'undefined'
        ) {
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: 'Hanna Music',
            album: this.currentContextName,
            artwork: track.coverUrl
                ? [
                    {
                        src: track.coverUrl,
                        sizes: '512x512',
                    },
                ]
                : [],
        });
    }

    updateMediaPositionState() {
        if (
            !('mediaSession' in navigator) ||
            typeof navigator.mediaSession.setPositionState !== 'function'
        ) {
            return;
        }

        const audio = this.currentAudio();

        if (
            !Number.isFinite(audio.duration) ||
            audio.duration <= 0 ||
            !Number.isFinite(audio.currentTime)
        ) {
            return;
        }

        try {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: Math.min(audio.currentTime, audio.duration),
            });
        } catch {
            // Invalid or unsupported position state.
        }
    }

    bindMediaSession() {
        if (!('mediaSession' in navigator)) {
            return;
        }

        const register = (action, handler) => {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch {
                // The browser does not support this media action.
            }
        };

        register('play', () => {
            void this.play();
        });
        register('pause', () => this.pause());
        register('nexttrack', () => {
            void this.next(false);
        });
        register('previoustrack', () => {
            void this.previous();
        });
        register('seekto', (details) => {
            const audio = this.currentAudio();

            if (Number.isFinite(details.seekTime)) {
                audio.currentTime = details.seekTime;
                this.autoTransitionTriggered = false;
            }
        });
    }
}

function initializePlayer() {
    new HannaMusicPlayer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}
