<?php

namespace App\Http\Controllers;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function index(): View
    {
        $tracks = $this->discoverTracks();

        $playlists = $this->preparePlaylists($tracks);

        return view('home', [
            'pageTitle' => config(
                'music.title',
                'Hanna Music'
            ),

            'pageDescription' => config(
                'music.description',
                'موسیقی‌های حنا'
            ),

            'tracks' => $tracks,

            'playlists' => $playlists,
        ]);
    }

    /**
     * تمام فایل‌های صوتی موجود در public/music/audio را پیدا می‌کند.
     */
    private function discoverTracks(): Collection
    {
        $audioDirectory = trim(
            config(
                'music.audio_directory',
                'music/audio'
            ),
            '/\\'
        );

        $absoluteDirectory = public_path(
            $audioDirectory
        );

        if (! File::isDirectory($absoluteDirectory)) {
            return collect();
        }

        $allowedExtensions = collect(
            config(
                'music.allowed_extensions',
                ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac']
            )
        )
            ->map(
                fn (string $extension): string =>
                    mb_strtolower($extension)
            )
            ->all();

        return collect(File::files($absoluteDirectory))
            ->filter(function ($file) use (
                $allowedExtensions
            ): bool {
                return in_array(
                    mb_strtolower(
                        $file->getExtension()
                    ),
                    $allowedExtensions,
                    true
                );
            })
            ->sort(function ($firstFile, $secondFile): int {
                return strnatcasecmp(
                    $firstFile->getFilename(),
                    $secondFile->getFilename()
                );
            })
            ->values()
            ->map(function ($file) use (
                $audioDirectory
            ): array {
                $filename = $file->getFilename();

                $extension = $file->getExtension();

                $basename = $file->getBasename(
                    '.'.$extension
                );

                $title = $this->makeTitleFromFilename(
                    $basename
                );

                $relativeAudioPath =
                    $audioDirectory.'/'.$filename;

                return [
                    'id' => 'track-'.substr(
                        sha1($filename),
                        0,
                        16
                    ),

                    'title' => $title,

                    'filename' => $filename,

                    'audio_url' => asset(
                        $this->encodeAssetPath(
                            $relativeAudioPath
                        )
                    ),

                    'cover_url' => $this->findCover(
                        $basename
                    ),

                    'extension' => mb_strtolower(
                        $extension
                    ),

                    'size' => $file->getSize(),
                ];
            });
    }

    /**
     * عنوان قابل‌نمایش را از نام فایل استخراج می‌کند.
     *
     * مثال:
     * 03 Blinding Lights.flac
     * تبدیل می‌شود به:
     * Blinding Lights
     */
    private function makeTitleFromFilename(
        string $basename
    ): string {
        $title = preg_replace(
            '/^\s*\d+\s*[-._]?\s*/u',
            '',
            $basename
        );

        $title = str_replace(
            '_',
            ' ',
            $title ?? $basename
        );

        $title = preg_replace(
            '/\s+/u',
            ' ',
            $title
        );

        return trim($title ?: $basename);
    }

    /**
     * اگر کاوری هم‌نام آهنگ وجود داشته باشد، آن را پیدا می‌کند.
     *
     * مثال:
     * audio/03 Blinding Lights.flac
     * covers/03 Blinding Lights.webp
     */
    private function findCover(
        string $audioBasename
    ): ?string {
        $coverDirectory = trim(
            config(
                'music.cover_directory',
                'music/covers'
            ),
            '/\\'
        );

        foreach (
            ['webp', 'jpg', 'jpeg', 'png']
            as $extension
        ) {
            $relativePath =
                $coverDirectory
                .'/'
                .$audioBasename
                .'.'
                .$extension;

            if (File::exists(public_path($relativePath))) {
                return asset(
                    $this->encodeAssetPath(
                        $relativePath
                    )
                );
            }
        }

        return null;
    }

    /**
     * پلی‌لیست‌های تعریف‌شده در config/music.php را آماده می‌کند.
     */
    private function preparePlaylists(
        Collection $tracks
    ): Collection {
        $tracksByFilename = $tracks->keyBy(
            'filename'
        );

        return collect(
            config('music.playlists', [])
        )
            ->filter(function (array $playlist): bool {
                return isset(
                    $playlist['id'],
                    $playlist['name']
                );
            })
            ->map(function (
                array $playlist
            ) use (
                $tracks,
                $tracksByFilename
            ): array {
                $configuredFiles =
                    $playlist['files'] ?? [];

                if ($configuredFiles === '*') {
                    $trackIds = $tracks
                        ->pluck('id')
                        ->values();
                } else {
                    $trackIds = collect(
                        $configuredFiles
                    )
                        ->map(function (
                            string $filename
                        ) use (
                            $tracksByFilename
                        ): ?string {
                            return $tracksByFilename
                                ->get($filename)['id']
                                ?? null;
                        })
                        ->filter()
                        ->unique()
                        ->values();
                }

                $cover = $playlist['cover'] ?? null;

                return [
                    'id' => (string) $playlist['id'],

                    'name' => (string) $playlist['name'],

                    'description' =>
                        $playlist['description']
                        ?? null,

                    'cover_url' => $cover
                        ? asset(
                            $this->encodeAssetPath(
                                ltrim($cover, '/\\')
                            )
                        )
                        : null,

                    'track_ids' => $trackIds->all(),

                    'track_count' => $trackIds->count(),
                ];
            })
            ->filter(
                fn (array $playlist): bool =>
                    $playlist['track_count'] > 0
            )
            ->values();
    }

    /**
     * فاصله‌ها و حروف خاص نام فایل را برای URL رمزگذاری می‌کند.
     */
    private function encodeAssetPath(
        string $path
    ): string {
        return collect(
            explode(
                '/',
                str_replace('\\', '/', $path)
            )
        )
            ->map(
                fn (string $segment): string =>
                    rawurlencode($segment)
            )
            ->implode('/');
    }
}