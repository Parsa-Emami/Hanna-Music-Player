@extends('layouts.app')

@section('title', $pageTitle)

@section('content')
    {{-- Hero --}}
    <section
        class="relative overflow-hidden rounded-[2rem]
               bg-zinc-950 px-6 py-14 text-white
               sm:px-10 sm:py-20"
    >
        <div
            class="pointer-events-none absolute -left-24 -top-24
                   size-72 rounded-full bg-white/[0.06] blur-3xl"
        ></div>

        <div
            class="pointer-events-none absolute -bottom-28 -right-20
                   size-80 rounded-full bg-white/[0.05] blur-3xl"
        ></div>

        <div
            class="pointer-events-none absolute left-1/2 top-1/2
                   size-[26rem] -translate-x-1/2 -translate-y-1/2
                   rounded-full bg-white/[0.035] blur-3xl"
        ></div>

        <div class="relative max-w-2xl">
            <span
                class="inline-flex items-center gap-2 rounded-full
                       border border-white/15 bg-white/5 px-4 py-2
                       text-xs text-white/70"
            >
                <span class="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"></span>
                ساخته‌شده برای حنا
            </span>

            <h1
                class="mt-6 text-[clamp(2.25rem,8vw,4rem)]
                       font-black leading-[1.05] tracking-tight"
            >
                {{ $pageTitle }}
            </h1>

            <p
                class="mt-5 max-w-xl text-sm leading-7
                       text-white/60 sm:text-base sm:leading-8"
            >
                {{ $pageDescription }}
            </p>

            @if ($tracks->isNotEmpty() || $playlists->isNotEmpty())
                <div class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                    @if ($tracks->isNotEmpty())
                        <span>{{ $tracks->count() }} آهنگ</span>
                    @endif

                    @if ($tracks->isNotEmpty() && $playlists->isNotEmpty())
                        <span class="size-1 rounded-full bg-white/20"></span>
                    @endif

                    @if ($playlists->isNotEmpty())
                        <span>{{ $playlists->count() }} پلی‌لیست</span>
                    @endif
                </div>
            @endif

            @if ($tracks->isNotEmpty())
                <div class="mt-8 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        data-player-start-all
                        class="inline-flex touch-manipulation select-none items-center
                               justify-center gap-2 rounded-full bg-white px-7 py-3.5
                               text-sm font-bold text-zinc-950 transition-all
                               active:scale-95 active:bg-zinc-200 hover:bg-zinc-200
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-white focus-visible:ring-offset-2
                               focus-visible:ring-offset-zinc-950
                               [-webkit-tap-highlight-color:transparent]"
                    >
                        <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        پخش همه آهنگ‌ها
                    </button>

                    @if ($playlists->isNotEmpty())
                        <a
                            href="#playlists"
                            class="inline-flex touch-manipulation items-center gap-1.5
                                   rounded-full px-5 py-3.5 text-sm font-semibold
                                   text-white/70 transition-colors hover:text-white
                                   active:text-white
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-white/70 focus-visible:ring-offset-2
                                   focus-visible:ring-offset-zinc-950
                                   [-webkit-tap-highlight-color:transparent]"
                        >
                            پلی‌لیست‌ها
                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </a>
                    @endif
                </div>
            @endif
        </div>
    </section>

    {{-- Playlists --}}
    @if ($playlists->isNotEmpty())
        <section id="playlists" class="mt-14 scroll-mt-6">
            <div class="mb-6 flex items-end justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Playlists
                    </p>
                    <h2 class="mt-2 text-2xl font-black tracking-tight">
                        پلی‌لیست‌ها
                    </h2>
                </div>

                <span class="text-sm tabular-nums text-zinc-500">
                    {{ $playlists->count() }} پلی‌لیست
                </span>
            </div>

            <div
                class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3
                       [-ms-overflow-style:none] [scrollbar-width:none]
                       [&::-webkit-scrollbar]:hidden
                       sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5
                       sm:overflow-visible sm:pb-0 lg:grid-cols-3"
            >
                @foreach ($playlists as $playlist)
                    <article
                        ontouchstart=""
                        class="group w-[74%] max-w-72 shrink-0 snap-start rounded-3xl
                               border border-zinc-200 bg-white p-4 shadow-sm
                               transition-transform active:scale-[0.98]
                               sm:w-auto sm:max-w-none
                               dark:border-white/10 dark:bg-white/[0.04]"
                    >
                        <div class="aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-white/10">
                            @if ($playlist['cover_url'])
                                <img
                                    src="{{ $playlist['cover_url'] }}"
                                    alt="{{ $playlist['name'] }}"
                                    loading="lazy"
                                    class="size-full object-cover grayscale
                                           transition-transform duration-500
                                           group-active:scale-105"
                                >
                            @else
                                <div class="flex size-full items-center justify-center text-5xl text-zinc-300 dark:text-white/20">
                                    ♫
                                </div>
                            @endif
                        </div>

                        <div class="mt-4">
                            <h3 class="truncate text-lg font-bold">
                                {{ $playlist['name'] }}
                            </h3>

                            @if ($playlist['description'])
                                <p class="mt-1.5 line-clamp-2 text-sm leading-6 text-zinc-500">
                                    {{ $playlist['description'] }}
                                </p>
                            @endif

                            <p class="mt-3 text-xs tabular-nums text-zinc-400">
                                {{ $playlist['track_count'] }} آهنگ
                            </p>

                            <button
                                type="button"
                                data-playlist-start
                                data-playlist-track-ids='@json($playlist["track_ids"])'
                                class="mt-4 flex w-full touch-manipulation select-none
                                       items-center justify-center gap-2 rounded-full
                                       bg-zinc-950 px-4 py-3 text-sm font-bold text-white
                                       transition-all active:scale-95 hover:bg-zinc-800
                                       focus-visible:outline-none focus-visible:ring-2
                                       focus-visible:ring-zinc-950 focus-visible:ring-offset-2
                                       focus-visible:ring-offset-white
                                       dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200
                                       dark:focus-visible:ring-white
                                       dark:focus-visible:ring-offset-zinc-900
                                       [-webkit-tap-highlight-color:transparent]"
                            >
                                <svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                پخش پلی‌لیست
                            </button>
                        </div>
                    </article>
                @endforeach
            </div>
        </section>
    @endif

    {{-- Library --}}
    <section class="mt-14 pb-12">
        <div class="mb-6 flex items-end justify-between gap-4">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Library
                </p>
                <h2 class="mt-2 text-2xl font-black tracking-tight">
                    همه آهنگ‌ها
                </h2>
            </div>

            <span class="text-sm tabular-nums text-zinc-500">
                {{ $tracks->count() }} آهنگ
            </span>
        </div>

        <div class="space-y-1.5">
            @forelse ($tracks as $index => $track)
                <article
                    data-track-row="{{ $track['id'] }}"
                    ontouchstart=""
                    class="group flex items-center justify-between gap-3 rounded-2xl
                           border border-transparent p-2 transition-colors
                           hover:border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100
                           sm:gap-4 sm:p-2.5
                           dark:hover:border-white/10 dark:hover:bg-white/[0.03]
                           dark:active:bg-white/[0.06]"
                >
                    <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <span class="hidden w-5 shrink-0 text-center text-xs tabular-nums text-zinc-400 sm:block">
                            {{ $index + 1 }}
                        </span>

                        <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 shadow-sm dark:bg-white/10">
                            @if ($track['cover_url'])
                                <img
                                    src="{{ $track['cover_url'] }}"
                                    alt="{{ $track['title'] }}"
                                    loading="lazy"
                                    class="size-full object-cover grayscale"
                                >
                            @else
                                <span class="text-zinc-400">♪</span>
                            @endif
                        </div>

                        <div class="min-w-0">
                            <h3 class="truncate font-bold">
                                {{ $track['title'] }}
                            </h3>
                            <p class="mt-1 text-xs text-zinc-500">
                                برای حنا
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        data-player-track
                        data-track-id="{{ $track['id'] }}"
                        data-audio-url="{{ $track['audio_url'] }}"
                        data-cover-url="{{ $track['cover_url'] ?? '' }}"
                        data-title="{{ $track['title'] }}"
                        aria-label="پخش {{ $track['title'] }}"
                        class="flex size-11 shrink-0 touch-manipulation select-none
                               items-center justify-center rounded-full bg-zinc-950
                               text-white transition-all active:scale-90
                               hover:bg-zinc-800
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-zinc-950 focus-visible:ring-offset-2
                               focus-visible:ring-offset-white
                               dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200
                               dark:focus-visible:ring-white
                               dark:focus-visible:ring-offset-zinc-900
                               [-webkit-tap-highlight-color:transparent]"
                    >
                        <span data-track-icon class="text-[13px] leading-none">▶</span>
                    </button>
                </article>
            @empty
                <div class="rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10">
                    <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400 dark:bg-white/10">
                        ♫
                    </div>
                    <p class="mt-4 text-sm leading-6 text-zinc-500">
                        هنوز آهنگی داخل پوشه
                        <code class="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-white/10">public/music/audio</code>
                        قرار نگرفته است.
                    </p>
                </div>
            @endforelse
        </div>
    </section>
@endsection