function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) {
        return 'نامشخص';
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '۰ بایت';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const size = bytes / (1024 ** index);

    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function initializeAudioUpload() {
    const input = document.querySelector('#song-audio');
    const durationInput = document.querySelector('#song-duration');
    const information = document.querySelector(
        '#song-audio-information'
    );

    if (!input || !durationInput || !information) {
        return;
    }

    input.addEventListener('change', () => {
        const file = input.files?.[0];

        durationInput.value = '0';

        if (!file) {
            information.textContent = 'حداکثر حجم: ۲۰۰ مگابایت';
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio();

        audio.preload = 'metadata';

        audio.addEventListener('loadedmetadata', () => {
            const duration = Number.isFinite(audio.duration)
                ? Math.round(audio.duration)
                : 0;

            durationInput.value = String(duration);

            information.textContent =
                `${file.name} · ${formatSize(file.size)} · ` +
                `${formatDuration(duration)}`;

            URL.revokeObjectURL(objectUrl);
        }, { once: true });

        audio.addEventListener('error', () => {
            information.textContent =
                `${file.name} · ${formatSize(file.size)} · ` +
                'مدت فایل قابل تشخیص نیست';

            URL.revokeObjectURL(objectUrl);
        }, { once: true });

        audio.src = objectUrl;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeAudioUpload
    );
} else {
    initializeAudioUpload();
}