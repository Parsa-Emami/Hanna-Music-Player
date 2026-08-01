<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <meta name="theme-color" content="#0c0c0c">

    <meta
        name="description"
        content="آهنگ‌ها و پلی‌لیست‌های حنا"
    >

    <title>@yield('title', 'Hanna Music')</title>

    <script>
        (() => {
            const storageKey = 'hanna-music-theme';
            const savedTheme = localStorage.getItem(storageKey);
            const systemDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            const theme = savedTheme ?? (systemDark ? 'dark' : 'light');
            const isDark = theme === 'dark';

            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark
                ? 'dark'
                : 'light';
        })();
    </script>

    @vite([
        'resources/css/app.css',
        'resources/js/app.js',
    ])
</head>

<body>
    <div class="min-h-screen pb-64 sm:pb-52 lg:pb-36">
        <header
            class="sticky top-0 z-40 border-b border-black/10
                   bg-[#f4f4f2]/90 backdrop-blur-xl
                   dark:border-white/10 dark:bg-[#0c0c0c]/90"
        >
            <div
                class="mx-auto flex h-16 max-w-6xl items-center
                       justify-between px-4 sm:px-6"
            >
                <a href="{{ route('home') }}" class="flex items-center gap-3">
                    <span
                        class="flex size-10 items-center justify-center
                               rounded-full bg-zinc-950 text-white
                               dark:bg-white dark:text-zinc-950"
                    >
                        ♪
                    </span>

                    <span>
                        <span class="block text-sm font-bold">Hanna Music</span>
                        <span class="block text-xs text-zinc-500">برای حنا</span>
                    </span>
                </a>

                <button
                    type="button"
                    data-theme-toggle
                    class="mono-button-secondary size-10 p-0"
                    aria-label="تغییر تم"
                >
                    <svg
                        data-theme-dark-icon
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.8"
                            d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z"
                        />
                    </svg>

                    <svg
                        data-theme-light-icon
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        class="hidden size-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.8"
                            d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.36-6.36-1.06 1.06M6.7 17.3l-1.06 1.06m12.72 0-1.06-1.06M6.7 6.7 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                        />
                    </svg>
                </button>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            @yield('content')
        </main>
    </div>

    <audio
        data-audio-element
        data-crossfade-seconds="{{ config('music.crossfade_seconds', 5) }}"
        preload="metadata"
        playsinline
        webkit-playsinline
    ></audio>

    <section
        class="fixed inset-x-0 bottom-0 z-50 border-t border-black/10
               bg-white/95 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]
               backdrop-blur-xl dark:border-white/10 dark:bg-[#111111]/95"
        aria-label="پخش‌کننده موسیقی"
    >
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <div
                class="grid items-center gap-3 py-3
                       lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.35fr)_minmax(0,1fr)]
                       lg:gap-5"
            >
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="flex size-14 shrink-0 items-center justify-center
                               overflow-hidden rounded-2xl bg-zinc-200
                               dark:bg-white/10"
                    >
                        <img
                            data-player-cover
                            src=""
                            alt=""
                            class="hidden size-full object-cover"
                        >

                        <span data-player-cover-fallback>♪</span>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p
                            data-player-title
                            aria-live="polite"
                            class="truncate text-sm font-bold"
                        >
                            یک آهنگ انتخاب کن
                        </p>

                        <div class="mt-1 flex min-w-0 items-center gap-2">
                            <p
                                data-player-subtitle
                                class="truncate text-xs text-zinc-500"
                            >
                                Hanna Music
                            </p>

                            <span class="size-1 shrink-0 rounded-full bg-zinc-300 dark:bg-white/20"></span>

                            <span
                                data-player-crossfade-label
                                class="shrink-0 text-[10px] text-zinc-400"
                            >
                                فید ۵ ثانیه‌ای
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex min-w-0 flex-col items-center gap-2">
                    <div class="flex items-center justify-center gap-1 sm:gap-2" dir="ltr">
                        <button
                            type="button"
                            data-player-shuffle
                            class="player-mode-button"
                            aria-label="فعال‌کردن پخش تصادفی"
                            aria-pressed="false"
                        >
                            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            data-player-previous
                            class="player-control-button"
                            aria-label="آهنگ قبلی"
                        >
                            <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
                                <path d="M6 5h2v14H6V5Zm3.5 7L19 5v14l-9.5-7Z" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            data-player-toggle
                            class="flex size-12 items-center justify-center rounded-full
                                   bg-zinc-950 text-white shadow-sm active:scale-95
                                   dark:bg-white dark:text-zinc-950"
                            aria-label="پخش یا توقف"
                        >
                            <span data-player-play-icon class="translate-x-[-1px]">▶</span>
                            <span data-player-pause-icon class="hidden">❚❚</span>
                        </button>

                        <button
                            type="button"
                            data-player-next
                            class="player-control-button"
                            aria-label="آهنگ بعدی"
                        >
                            <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
                                <path d="M16 5h2v14h-2V5ZM5 5l9.5 7L5 19V5Z" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            data-player-repeat-one
                            class="player-mode-button relative"
                            aria-label="تکرار فقط همین آهنگ"
                            aria-pressed="false"
                        >
                            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3m14-3v2a4 4 0 0 1-4 4H4" />
                            </svg>
                            <span class="absolute bottom-0.5 right-1.5 text-[8px] font-black">1</span>
                        </button>
                    </div>

                    <div
                        class="flex w-full items-center gap-2 text-[11px]
                               text-zinc-500"
                        dir="ltr"
                    >
                        <span data-player-current-time class="w-9">0:00</span>

                        <input
                            data-player-progress
                            type="range"
                            min="0"
                            max="1000"
                            value="0"
                            class="min-w-0 flex-1"
                            aria-label="موقعیت پخش آهنگ"
                        >

                        <span data-player-duration class="w-9 text-right">0:00</span>
                    </div>
                </div>

                <div
                    class="flex items-center gap-3 border-t border-black/5 pt-2
                           dark:border-white/10 lg:justify-end lg:border-0 lg:pt-0"
                    dir="ltr"
                >
                    <button
                        type="button"
                        data-player-mute
                        class="flex size-9 shrink-0 items-center justify-center
                               rounded-full text-sm text-zinc-600 hover:bg-zinc-200
                               dark:text-zinc-300 dark:hover:bg-white/10"
                        aria-label="قطع صدا"
                        title="قطع یا وصل‌کردن صدا"
                    >
                        <span data-player-volume-icon aria-hidden="true">🔊</span>
                    </button>

                    <input
                        data-player-volume
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value="80"
                        class="h-8 min-w-0 flex-1 lg:w-28 lg:flex-none"
                        aria-label="میزان صدا"
                    >

                    <output
                        data-player-volume-value
                        class="w-10 text-right text-xs tabular-nums text-zinc-500"
                    >
                        80%
                    </output>
                </div>
            </div>
        </div>
    </section>
</body>
</html>
