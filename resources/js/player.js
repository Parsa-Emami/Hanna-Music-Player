class HannaMusicPlayer {
    constructor() {
        this.audio = document.querySelector('[data-audio-element]');
        this.trackButtons = Array.from(
            document.querySelectorAll('[data-player-track]')
        );
        this.playlistButtons = Array.from(
            document.querySelectorAll('[data-playlist-start]')
        );

        this.startAllButton = document.querySelector(
            '[data-player-start-all]'
        );
        this.toggleButton = document.querySelector(
            '[data-player-toggle]'
        );
        this.previousButton = document.querySelector(
            '[data-player-previous]'
        );
        this.nextButton = document.querySelector(
            '[data-player-next]'
        );
        this.progressInput = document.querySelector(
            '[data-player-progress]'
        );
        this.volumeInput = document.querySelector(
            '[data-player-volume]'
        );
        this.playerTitle = document.querySelector(
            '[data-player-title]'
        );
        this.playerSubtitle = document.querySelector(
            '[data-player-subtitle]'
        );
        this.playerCover = document.querySelector(
            '[data-player-cover]'
        );
        this.playerCoverFallback = document.querySelector(
            '[data-player-cover-fallback]'
        );
        this.currentTimeElement = document.querySelector(
            '[data-player-current-time]'
        );
        this.durationElement = document.querySelector(
            '[data-player-duration]'
        );
        this.playIcon = document.querySelector(
            '[data-player-play-icon]'
        );
        this.pauseIcon = document.querySelector(
            '[data-player-pause-icon]'
        );

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
        this.queue = [...this.allTracksQueue];
        this.queuePosition = -1;
        this.currentTrackIndex = -1;

        if (!this.audio || !this.toggleButton) {
            return;
        }

        this.prepareAudioElement();
        this.restoreVolume();
        this.bindEvents();
        this.updateDisabledState();
    }

    prepareAudioElement() {
        this.audio.setAttribute('playsinline', '');
        this.audio.setAttribute('webkit-playsinline', '');
        this.audio.preload = 'metadata';
    }

    bindEvents() {
        this.startAllButton?.addEventListener('click', () => {
            const firstTrack = this.allTracksQueue[0];

            if (!Number.isInteger(firstTrack)) {
                return;
            }

            this.setQueue(this.allTracksQueue, firstTrack);
            void this.loadTrack(firstTrack, true);
        });

        this.trackButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.setQueue(this.allTracksQueue, index);

                if (this.currentTrackIndex === index) {
                    void this.toggle();
                    return;
                }

                void this.loadTrack(index, true);
            });
        });

        this.playlistButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const ids = this.parseTrackIds(
                    button.dataset.playlistTrackIds
                );
                const queue = ids
                    .map((id) => this.indexByTrackId.get(String(id)))
                    .filter(Number.isInteger);
                const firstTrack = queue[0];

                if (!Number.isInteger(firstTrack)) {
                    return;
                }

                this.setQueue(queue, firstTrack);
                void this.loadTrack(firstTrack, true);
            });
        });

        this.toggleButton.addEventListener('click', () => {
            void this.toggle();
        });

        this.previousButton?.addEventListener('click', () => {
            void this.previous();
        });

        this.nextButton?.addEventListener('click', () => {
            void this.next();
        });

        this.audio.addEventListener('play', () => {
            this.updatePlayingState(true);
        });

        this.audio.addEventListener('pause', () => {
            this.updatePlayingState(false);
        });

        this.audio.addEventListener('ended', () => {
            void this.next();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.durationElement) {
                this.durationElement.textContent = this.formatTime(
                    this.audio.duration
                );
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('canplay', () => {
            const track = this.tracks[this.currentTrackIndex];

            if (track && this.playerSubtitle) {
                this.playerSubtitle.textContent = 'Hanna Music';
            }
        });

        this.audio.addEventListener('error', () => {
            this.handleAudioError();
        });

        this.progressInput?.addEventListener('input', () => {
            if (!Number.isFinite(this.audio.duration)) {
                return;
            }

            const ratio = Number(this.progressInput.value) / 1000;
            this.audio.currentTime = ratio * this.audio.duration;
        });

        this.volumeInput?.addEventListener('input', () => {
            const volume = Math.min(
                1,
                Math.max(0, Number(this.volumeInput.value) / 100)
            );

            try {
                this.audio.volume = volume;
                localStorage.setItem(
                    'hanna-player-volume',
                    String(volume)
                );
            } catch {
                // Safari iOS may control output volume at system level.
            }
        });

        this.bindMediaSession();
    }

    setQueue(queue, currentTrackIndex) {
        this.queue = Array.from(
            new Set(
                queue.filter(
                    (index) =>
                        Number.isInteger(index) &&
                        index >= 0 &&
                        index < this.tracks.length
                )
            )
        );

        this.queuePosition = this.queue.indexOf(currentTrackIndex);

        if (this.queuePosition === -1 && this.queue.length > 0) {
            this.queuePosition = 0;
        }
    }

    async loadTrack(index, autoplay = true) {
        const track = this.tracks[index];

        if (!track?.audioUrl) {
            this.showPlayerMessage(
                'خطا در پخش آهنگ',
                'آدرس فایل آهنگ معتبر نیست'
            );
            return;
        }

        this.currentTrackIndex = index;

        const queuePosition = this.queue.indexOf(index);
        if (queuePosition >= 0) {
            this.queuePosition = queuePosition;
        }

        this.audio.pause();
        this.audio.src = track.audioUrl;
        this.audio.preload = 'metadata';
        this.audio.load();

        this.resetProgress();
        this.updateTrackInformation(track);
        this.updateActiveTrack();
        this.updateMediaMetadata(track);

        if (autoplay) {
            await this.play();
        }
    }

    async play() {
        if (!this.audio || this.tracks.length === 0) {
            return;
        }

        if (this.currentTrackIndex < 0 || !this.audio.getAttribute('src')) {
            const firstTrack = this.queue[0] ?? this.allTracksQueue[0];

            if (!Number.isInteger(firstTrack)) {
                return;
            }

            await this.loadTrack(firstTrack, false);
        }

        try {
            await this.audio.play();
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
        this.audio?.pause();
    }

    async toggle() {
        if (!this.audio || this.tracks.length === 0) {
            return;
        }

        if (this.currentTrackIndex < 0 || !this.audio.getAttribute('src')) {
            const firstTrack = this.queue[0] ?? this.allTracksQueue[0];

            if (Number.isInteger(firstTrack)) {
                await this.loadTrack(firstTrack, true);
            }

            return;
        }

        if (this.audio.paused) {
            await this.play();
        } else {
            this.pause();
        }
    }

    async next() {
        if (this.queue.length === 0) {
            return;
        }

        this.queuePosition =
            (this.queuePosition + 1 + this.queue.length) %
            this.queue.length;

        await this.loadTrack(this.queue[this.queuePosition], true);
    }

    async previous() {
        if (this.queue.length === 0) {
            return;
        }

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        this.queuePosition =
            (this.queuePosition - 1 + this.queue.length) %
            this.queue.length;

        await this.loadTrack(this.queue[this.queuePosition], true);
    }

    updateTrackInformation(track) {
        if (this.playerTitle) {
            this.playerTitle.textContent = track.title;
        }

        if (this.playerSubtitle) {
            this.playerSubtitle.textContent = 'Hanna Music';
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

    updateProgress() {
        if (this.currentTimeElement) {
            this.currentTimeElement.textContent = this.formatTime(
                this.audio.currentTime
            );
        }

        if (
            !this.progressInput ||
            !Number.isFinite(this.audio.duration) ||
            this.audio.duration <= 0
        ) {
            return;
        }

        const progress = this.audio.currentTime / this.audio.duration;
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
                    index === this.currentTrackIndex && isPlaying
                        ? '❚❚'
                        : '▶';
            }
        });
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

    handleAudioError() {
        const code = this.audio?.error?.code;
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

    restoreVolume() {
        let volume = 0.8;

        try {
            const storedVolume = Number(
                localStorage.getItem('hanna-player-volume')
            );

            if (Number.isFinite(storedVolume)) {
                volume = Math.min(1, Math.max(0, storedVolume));
            }

            this.audio.volume = volume;
        } catch {
            // Local storage or volume changes may be restricted.
        }

        if (this.volumeInput) {
            this.volumeInput.value = String(Math.round(volume * 100));
        }
    }

    updateDisabledState() {
        const disabled = this.tracks.length === 0;

        [
            this.startAllButton,
            this.toggleButton,
            this.previousButton,
            this.nextButton,
            this.progressInput,
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
            album: 'برای حنا',
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
            void this.next();
        });
        register('previoustrack', () => {
            void this.previous();
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
