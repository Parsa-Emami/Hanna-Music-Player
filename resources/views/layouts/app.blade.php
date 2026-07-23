<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <meta
        name="theme-color"
        content="#0c0c0c"
    >

    <meta
        name="description"
        content="آهنگ‌ها و پلی‌لیست‌های حنا"
    >

    <title>
        @yield('title', 'Hanna Music')
    </title>

    <script>
        (() => {
            const storageKey = 'hanna-music-theme';

            const savedTheme =
                localStorage.getItem(storageKey);

            const systemDark =
                window.matchMedia(
                    '(prefers-color-scheme: dark)'
                ).matches;

            const theme = savedTheme
                ?? (systemDark ? 'dark' : 'light');

            const isDark = theme === 'dark';

            document.documentElement.classList.toggle(
                'dark',
                isDark
            );

            document.documentElement.style.colorScheme =
                isDark ? 'dark' : 'light';
        })();
    </script>

    @vite([
        'resources/css/app.css',
        'resources/js/app.js',
    ])
</head>

<body>
    <div class="min-h-screen pb-40 sm:pb-32">
        <header
            class="sticky top-0 z-40 border-b border-black/10
                   bg-[#f4f4f2]/90 backdrop-blur-xl
                   dark:border-white/10 dark:bg-[#0c0c0c]/90"
        >
            <div
                class="mx-auto flex h-16 max-w-6xl
                       items-center justify-between
                       px-4 sm:px-6"
            >
                <a
                    href="{{ route('home') }}"
                    class="flex items-center gap-3"
                >
                    <span
                        class="flex size-10 items-center
                               justify-center rounded-full
                               bg-zinc-950 text-white
                               dark:bg-white dark:text-zinc-950"
                    >
                        ♪
                    </span>

                    <span>
                        <span class="block text-sm font-bold">
                            Hanna Music
                        </span>

                        <span class="block text-xs text-zinc-500">
                            برای حنا
                        </span>
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
                            d="M21 12.79A9 9 0 1 1
                               11.21 3 7 7 0 0 0
                               21 12.79Z"
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
                            d="M12 3v1.5m0 15V21
                               m9-9h-1.5M4.5 12H3
                               m15.36-6.36-1.06 1.06
                               M6.7 17.3l-1.06 1.06
                               m12.72 0-1.06-1.06
                               M6.7 6.7 5.64 5.64
                               M16 12a4 4 0 1 1-8 0
                               4 4 0 0 1 8 0Z"
                        />
                    </svg>
                </button>
            </div>
        </header>

        <main
            class="mx-auto max-w-6xl px-4 py-8
                   sm:px-6 sm:py-12"
        >
            @yield('content')
        </main>
    </div>

    <audio
        data-audio-element
        preload="metadata"
    ></audio>

    <section
        class="fixed inset-x-0 bottom-0 z-50
               border-t border-black/10 bg-white/95
               shadow-[0_-10px_30px_rgba(0,0,0,0.05)]
               backdrop-blur-xl
               dark:border-white/10 dark:bg-[#111111]/95"
    >
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
            <div
                class="grid grid-cols-[minmax(0,1fr)_auto]
                       items-center gap-4 py-3
                       sm:grid-cols-[minmax(0,1fr)_minmax(280px,420px)_minmax(0,1fr)]"
            >
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="flex size-14 shrink-0 items-center
                               justify-center overflow-hidden
                               rounded-2xl bg-zinc-200
                               dark:bg-white/10"
                    >
                        <img
                            data-player-cover
                            src=""
                            alt=""
                            class="hidden size-full object-cover"
                        >

                        <span data-player-cover-fallback>
                            ♪
                        </span>
                    </div>

                    <div class="min-w-0">
                        <p
                            data-player-title
                            class="truncate text-sm font-bold"
                        >
                            یک آهنگ انتخاب کن
                        </p>

                        <p
                            data-player-subtitle
                            class="mt-1 truncate text-xs
                                   text-zinc-500"
                        >
                            Hanna Music
                        </p>
                    </div>
                </div>

                <div
                    class="flex w-40 flex-col items-center
                           gap-2 sm:w-full"
                >
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            data-player-previous
                            class="rounded-full p-2
                                   text-zinc-500
                                   hover:bg-zinc-200
                                   dark:hover:bg-white/10"
                            aria-label="آهنگ قبلی"
                        >
                            ⏮
                        </button>

                        <button
                            type="button"
                            data-player-toggle
                            class="flex size-12 items-center
                                   justify-center rounded-full
                                   bg-zinc-950 text-white
                                   dark:bg-white
                                   dark:text-zinc-950"
                            aria-label="پخش یا توقف"
                        >
                            <span data-player-play-icon>
                                ▶
                            </span>

                            <span
                                data-player-pause-icon
                                class="hidden"
                            >
                                ❚❚
                            </span>
                        </button>

                        <button
                            type="button"
                            data-player-next
                            class="rounded-full p-2
                                   text-zinc-500
                                   hover:bg-zinc-200
                                   dark:hover:bg-white/10"
                            aria-label="آهنگ بعدی"
                        >
                            ⏭
                        </button>
                    </div>

                    <div
                        class="flex w-full items-center gap-2
                               text-[11px] text-zinc-500"
                        dir="ltr"
                    >
                        <span
                            data-player-current-time
                            class="w-9"
                        >
                            0:00
                        </span>

                        <input
                            data-player-progress
                            type="range"
                            min="0"
                            max="1000"
                            value="0"
                            class="min-w-0 flex-1"
                        >

                        <span
                            data-player-duration
                            class="w-9 text-right"
                        >
                            0:00
                        </span>
                    </div>
                </div>

                <div
                    class="hidden items-center justify-end
                           gap-3 sm:flex"
                    dir="ltr"
                >
                    <span class="text-sm text-zinc-500">
                        🔊
                    </span>

                    <input
                        data-player-volume
                        type="range"
                        min="0"
                        max="100"
                        value="80"
                        class="w-24"
                    >
                </div>
            </div>
        </div>
    </section>
</body>
</html>