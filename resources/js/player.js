class HannaMusicPlayer {
    constructor() {
        this.audio = document.querySelector(
            '[data-audio-element]'
        );

        this.trackButtons = Array.from(
            document.querySelectorAll(
                '[data-player-track]'
            )
        );

        this.playlistButtons = Array.from(
            document.querySelectorAll(
                '[data-playlist-start]'
            )
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

        this.playerCoverFallback =
            document.querySelector(
                '[data-player-cover-fallback]'
            );

        this.currentTimeElement =
            document.querySelector(
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

        this.tracks = this.trackButtons.map(
            (button, index) => ({
                index,
                id: String(button.dataset.trackId),
                title:
                    button.dataset.title ||
                    'بدون عنوان',
                audioUrl:
                    button.dataset.audioUrl || '',
                coverUrl:
                    button.dataset.coverUrl || '',
            })
        );

        this.indexByTrackId = new Map(
            this.tracks.map((track) => [
                track.id,
                track.index,
            ])
        );

        this.allTracksQueue = this.tracks.map(
            (track) => track.index
        );

        this.queue = [...this.allTracksQueue];
        this.queuePosition = -1;
        this.currentTrackIndex = -1;

        if (!this.audio || !this.toggleButton) {
            return;
        }

        this.restoreVolume();
        this.bindEvents();
        this.updateDisabledState();
    }

    bindEvents() {
        this.startAllButton?.addEventListener(
            'click',
            () => {
                if (this.allTracksQueue.length === 0) {
                    return;
                }

                this.setQueue(
                    this.allTracksQueue,
                    this.allTracksQueue[0]
                );

                this.loadTrack(
                    this.allTracksQueue[0],
                    true
                );
            }
        );

        this.trackButtons.forEach(
            (button, index) => {
                button.addEventListener(
                    'click',
                    () => {
                        this.setQueue(
                            this.allTracksQueue,
                            index
                        );

                        if (
                            this.currentTrackIndex ===
                            index
                        ) {
                            this.toggle();
                            return;
                        }

                        this.loadTrack(index, true);
                    }
                );
            }
        );

        this.playlistButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const ids = this.parseTrackIds(
                    button.dataset
                        .playlistTrackIds
                );

                const queue = ids
                    .map((id) =>
                        this.indexByTrackId.get(
                            String(id)
                        )
                    )
                    .filter(Number.isInteger);

                if (queue.length === 0) {
                    return;
                }

                this.setQueue(queue, queue[0]);
                this.loadTrack(queue[0], true);
            });
        });

        this.toggleButton.addEventListener(
            'click',
            () => this.toggle()
        );

        this.previousButton?.addEventListener(
            'click',
            () => this.previous()
        );

        this.nextButton?.addEventListener(
            'click',
            () => this.next()
        );

        this.audio.addEventListener(
            'play',
            () => this.updatePlayingState(true)
        );

        this.audio.addEventListener(
            'pause',
            () => this.updatePlayingState(false)
        );

        this.audio.addEventListener(
            'ended',
            () => this.next()
        );

        this.audio.addEventListener(
            'loadedmetadata',
            () => {
                this.durationElement.textContent =
                    this.formatTime(
                        this.audio.duration
                    );
            }
        );

        this.audio.addEventListener(
            'timeupdate',
            () => this.updateProgress()
        );

        this.audio.addEventListener(
            'error',
            () => {
                this.updatePlayingState(false);

                this.playerTitle.textContent =
                    'خطا در پخش آهنگ';

                this.playerSubtitle.textContent =
                    'فایل آهنگ در دسترس نیست';
            }
        );

        this.progressInput?.addEventListener(
            'input',
            () => {
                if (
                    !Number.isFinite(
                        this.audio.duration
                    )
                ) {
                    return;
                }

                const ratio =
                    Number(
                        this.progressInput.value
                    ) / 1000;

                this.audio.currentTime =
                    ratio * this.audio.duration;
            }
        );

        this.volumeInput?.addEventListener(
            'input',
            () => {
                const volume =
                    Number(
                        this.volumeInput.value
                    ) / 100;

                this.audio.volume = volume;

                localStorage.setItem(
                    'hanna-player-volume',
                    String(volume)
                );
            }
        );

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

        this.queuePosition =
            this.queue.indexOf(
                currentTrackIndex
            );

        if (
            this.queuePosition === -1 &&
            this.queue.length > 0
        ) {
            this.queuePosition = 0;
        }
    }

    loadTrack(index, autoplay = true) {
        const track = this.tracks[index];

        if (!track?.audioUrl) {
            return;
        }

        this.currentTrackIndex = index;

        const queuePosition =
            this.queue.indexOf(index);

        if (queuePosition >= 0) {
            this.queuePosition =
                queuePosition;
        }

        this.audio.src = track.audioUrl;
        this.audio.load();

        this.playerTitle.textContent =
            track.title;

        this.playerSubtitle.textContent =
            'Hanna Music';

        this.currentTimeElement.textContent =
            '0:00';

        this.durationElement.textContent =
            '0:00';

        this.progressInput.value = '0';

        this.updateCover(track);
        this.updateActiveTrack();
        this.updateMediaMetadata(track);

        if (autoplay) {
            this.play();
        }
    }

    async play() {
        if (this.tracks.length === 0) {
            return;
        }

        if (this.currentTrackIndex < 0) {
            const firstTrack =
                this.queue[0] ??
                this.allTracksQueue[0];

            if (!Number.isInteger(firstTrack)) {
                return;
            }

            this.loadTrack(firstTrack, false);
        }

        try {
            await this.audio.play();
        } catch (error) {
            console.error(
                'Playback failed:',
                error
            );

            this.updatePlayingState(false);
        }
    }

    pause() {
        this.audio.pause();
    }

    toggle() {
        if (this.audio.paused) {
            this.play();
            return;
        }

        this.pause();
    }

    next() {
        if (this.queue.length === 0) {
            return;
        }

        this.queuePosition =
            (this.queuePosition + 1) %
            this.queue.length;

        this.loadTrack(
            this.queue[this.queuePosition],
            true
        );
    }

    previous() {
        if (this.queue.length === 0) {
            return;
        }

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        this.queuePosition =
            (
                this.queuePosition -
                1 +
                this.queue.length
            ) % this.queue.length;

        this.loadTrack(
            this.queue[this.queuePosition],
            true
        );
    }

    updateProgress() {
        this.currentTimeElement.textContent =
            this.formatTime(
                this.audio.currentTime
            );

        if (
            !Number.isFinite(
                this.audio.duration
            )
        ) {
            return;
        }

        const progress =
            this.audio.currentTime /
            this.audio.duration;

        this.progressInput.value =
            String(
                Math.round(progress * 1000)
            );
    }

    updatePlayingState(isPlaying) {
        this.playIcon?.classList.toggle(
            'hidden',
            isPlaying
        );

        this.pauseIcon?.classList.toggle(
            'hidden',
            !isPlaying
        );

        this.trackButtons.forEach(
            (button, index) => {
                const icon =
                    button.querySelector(
                        '[data-track-icon]'
                    );

                if (!icon) {
                    return;
                }

                icon.textContent =
                    index ===
                        this.currentTrackIndex &&
                    isPlaying
                        ? '❚❚'
                        : '▶';
            }
        );
    }

    updateActiveTrack() {
        this.trackButtons.forEach(
            (button, index) => {
                const active =
                    index ===
                    this.currentTrackIndex;

                button.classList.toggle(
                    'track-play-button-active',
                    active
                );

                button.setAttribute(
                    'aria-pressed',
                    active ? 'true' : 'false'
                );

                const row =
                    document.querySelector(
                        `[data-track-row="${
                            this.tracks[index].id
                        }"]`
                    );

                row?.classList.toggle(
                    'track-row-active',
                    active
                );
            }
        );
    }

    updateCover(track) {
        if (track.coverUrl) {
            this.playerCover.src =
                track.coverUrl;

            this.playerCover.alt =
                track.title;

            this.playerCover.classList.remove(
                'hidden'
            );

            this.playerCoverFallback
                ?.classList.add('hidden');

            return;
        }

        this.playerCover.removeAttribute(
            'src'
        );

        this.playerCover.classList.add(
            'hidden'
        );

        this.playerCoverFallback
            ?.classList.remove('hidden');
    }

    restoreVolume() {
        const storedVolume = Number(
            localStorage.getItem(
                'hanna-player-volume'
            )
        );

        const volume =
            Number.isFinite(storedVolume)
                ? Math.min(
                    1,
                    Math.max(0, storedVolume)
                )
                : 0.8;

        this.audio.volume = volume;

        if (this.volumeInput) {
            this.volumeInput.value =
                String(
                    Math.round(volume * 100)
                );
        }
    }

    updateDisabledState() {
        const disabled =
            this.tracks.length === 0;

        [
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
            const result =
                JSON.parse(value);

            return Array.isArray(result)
                ? result
                : [];
        } catch {
            return [];
        }
    }

    formatTime(seconds) {
        if (
            !Number.isFinite(seconds) ||
            seconds < 0
        ) {
            return '0:00';
        }

        const total =
            Math.floor(seconds);

        const minutes =
            Math.floor(total / 60);

        const remainingSeconds =
            total % 60;

        return `${minutes}:${String(
            remainingSeconds
        ).padStart(2, '0')}`;
    }

    updateMediaMetadata(track) {
        if (
            !('mediaSession' in navigator) ||
            typeof MediaMetadata ===
                'undefined'
        ) {
            return;
        }

        navigator.mediaSession.metadata =
            new MediaMetadata({
                title: track.title,
                artist: 'Hanna Music',
                album: 'برای حنا',

                artwork: track.coverUrl
                    ? [
                        {
                            src:
                                track.coverUrl,
                            sizes:
                                '512x512',
                        },
                    ]
                    : [],
            });
    }

    bindMediaSession() {
        if (
            !('mediaSession' in navigator)
        ) {
            return;
        }

        const register = (
            action,
            handler
        ) => {
            try {
                navigator.mediaSession
                    .setActionHandler(
                        action,
                        handler
                    );
            } catch {
                // مرورگر از این فرمان پشتیبانی نمی‌کند.
            }
        };

        register(
            'play',
            () => this.play()
        );

        register(
            'pause',
            () => this.pause()
        );

        register(
            'nexttrack',
            () => this.next()
        );

        register(
            'previoustrack',
            () => this.previous()
        );
    }
}

function initializePlayer() {
    new HannaMusicPlayer();
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializePlayer
    );
} else {
    initializePlayer();
}