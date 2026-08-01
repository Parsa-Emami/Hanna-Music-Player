<?php

namespace App\Http\Controllers;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\View\View;
use JsonException;

class HomeController extends Controller
{
    public function index(): View
    {
        [$tracks, $folderPlaylists] = $this->discoverLibrary();

        $configuredPlaylists = $this->prepareConfiguredPlaylists($tracks);

        $playlists = $folderPlaylists
            ->concat($configuredPlaylists)
            ->unique('id')
            ->values();

        return view('home', [
            'pageTitle' => config('music.title', 'Hanna Music'),
            'pageDescription' => config(
                'music.description',
                'موسیقی‌های حنا'
            ),
            'tracks' => $tracks,
            'playlists' => $playlists,
        ]);
    }

    /**
     * @return array{0: Collection<int, array<string, mixed>>, 1: Collection<int, array<string, mixed>>}
     */
    private function discoverLibrary(): array
    {
        $trackMap = collect();
        $folderPlaylists = collect();

        $legacyDirectory = trim(
            config('music.audio_directory', 'music/audio'),
            '/\\'
        );

        $legacyAbsolutePath = public_path($legacyDirectory);

        if (File::isDirectory($legacyAbsolutePath)) {
            $this->audioFiles($legacyAbsolutePath)->each(function ($file) use (
                $trackMap
            ): void {
                $track = $this->makeTrack($file->getPathname());
                $trackMap->put($track['relative_path'], $track);
            });
        }

        $playlistsDirectory = trim(
            config('music.playlists_directory', 'music/playlists'),
            '/\\'
        );

        $playlistsAbsolutePath = public_path($playlistsDirectory);

        if (File::isDirectory($playlistsAbsolutePath)) {
            collect(File::directories($playlistsAbsolutePath))
                ->sort(fn (string $first, string $second): int =>
                    strnatcasecmp(basename($first), basename($second))
                )
                ->values()
                ->each(function (string $directory) use (
                    $trackMap,
                    $folderPlaylists,
                    $playlistsDirectory
                ): void {
                    $metadata = $this->readPlaylistMetadata($directory);
                    $playlistCover = $this->findPlaylistCover(
                        $directory,
                        $metadata['cover'] ?? null
                    );

                    $trackIds = $this->audioFiles($directory)
                        ->map(function ($file) use (
                            $trackMap,
                            $playlistCover
                        ): string {
                            $track = $this->makeTrack(
                                $file->getPathname(),
                                $playlistCover
                            );

                            $trackMap->put($track['relative_path'], $track);

                            return $track['id'];
                        })
                        ->unique()
                        ->values();

                    if ($trackIds->isEmpty()) {
                        return;
                    }

                    $folderName = basename($directory);
                    $relativeFolder = $playlistsDirectory.'/'.$folderName;

                    $folderPlaylists->push([
                        'id' => 'folder-'.substr(sha1($relativeFolder), 0, 16),
                        'name' => (string) (
                            $metadata['name']
                            ?? $this->makeDisplayName($folderName)
                        ),
                        'description' => $metadata['description'] ?? null,
                        'cover_url' => $playlistCover,
                        'track_ids' => $trackIds->all(),
                        'track_count' => $trackIds->count(),
                        'source' => 'folder',
                    ]);
                });
        }

        return [
            $trackMap->values(),
            $folderPlaylists,
        ];
    }

    /**
     * @return Collection<int, \Symfony\Component\Finder\SplFileInfo>
     */
    private function audioFiles(string $directory): Collection
    {
        $allowedExtensions = collect(
            config('music.allowed_extensions', [
                'mp3',
                'm4a',
                'aac',
                'ogg',
                'wav',
                'flac',
                'opus',
            ])
        )
            ->map(fn (string $extension): string => mb_strtolower($extension))
            ->all();

        return collect(File::allFiles($directory))
            ->filter(fn ($file): bool => in_array(
                mb_strtolower($file->getExtension()),
                $allowedExtensions,
                true
            ))
            ->sort(fn ($first, $second): int => strnatcasecmp(
                $first->getRelativePathname(),
                $second->getRelativePathname()
            ))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function makeTrack(
        string $absolutePath,
        ?string $fallbackCover = null
    ): array {
        $relativePath = $this->relativePublicPath($absolutePath);
        $filename = basename($absolutePath);
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $basename = pathinfo($filename, PATHINFO_FILENAME);

        return [
            'id' => 'track-'.substr(sha1($relativePath), 0, 16),
            'title' => $this->makeTitleFromFilename($basename),
            'filename' => $filename,
            'relative_path' => $relativePath,
            'audio_url' => asset($this->encodeAssetPath($relativePath)),
            'cover_url' => $this->findTrackCover($absolutePath)
                ?? $fallbackCover,
            'extension' => mb_strtolower($extension),
            'size' => File::size($absolutePath),
        ];
    }

    private function makeTitleFromFilename(string $basename): string
    {
        $title = preg_replace('/^\s*\d+\s*[-._]?\s*/u', '', $basename);
        $title = str_replace(['_', '-'], ' ', $title ?? $basename);
        $title = preg_replace('/\s+/u', ' ', $title);

        return trim($title ?: $basename);
    }

    private function makeDisplayName(string $name): string
    {
        $name = str_replace(['_', '-'], ' ', $name);
        $name = preg_replace('/\s+/u', ' ', $name);

        return trim($name ?: 'پلی‌لیست');
    }

    private function findTrackCover(string $audioAbsolutePath): ?string
    {
        $directory = dirname($audioAbsolutePath);
        $basename = pathinfo($audioAbsolutePath, PATHINFO_FILENAME);

        foreach (['webp', 'jpg', 'jpeg', 'png'] as $extension) {
            $candidate = $directory.DIRECTORY_SEPARATOR.$basename.'.'.$extension;

            if (File::exists($candidate)) {
                return asset($this->encodeAssetPath(
                    $this->relativePublicPath($candidate)
                ));
            }
        }

        $legacyCoverDirectory = public_path(trim(
            config('music.cover_directory', 'music/covers'),
            '/\\'
        ));

        foreach (['webp', 'jpg', 'jpeg', 'png'] as $extension) {
            $candidate = $legacyCoverDirectory
                .DIRECTORY_SEPARATOR
                .$basename
                .'.'
                .$extension;

            if (File::exists($candidate)) {
                return asset($this->encodeAssetPath(
                    $this->relativePublicPath($candidate)
                ));
            }
        }

        return null;
    }

    private function findPlaylistCover(
        string $directory,
        ?string $configuredCover = null
    ): ?string {
        $candidates = [];

        if (is_string($configuredCover) && trim($configuredCover) !== '') {
            $candidates[] = $directory
                .DIRECTORY_SEPARATOR
                .ltrim(str_replace('/', DIRECTORY_SEPARATOR, $configuredCover), '/\\');
        }

        foreach (['cover', 'folder', 'playlist'] as $name) {
            foreach (['webp', 'jpg', 'jpeg', 'png'] as $extension) {
                $candidates[] = $directory
                    .DIRECTORY_SEPARATOR
                    .$name
                    .'.'
                    .$extension;
            }
        }

        foreach ($candidates as $candidate) {
            if (File::isFile($candidate)) {
                return asset($this->encodeAssetPath(
                    $this->relativePublicPath($candidate)
                ));
            }
        }

        return null;
    }

    /**
     * @return array{name?: string, description?: string, cover?: string}
     */
    private function readPlaylistMetadata(string $directory): array
    {
        $metadataPath = $directory.DIRECTORY_SEPARATOR.'playlist.json';

        if (! File::isFile($metadataPath)) {
            return [];
        }

        try {
            $metadata = json_decode(
                File::get($metadataPath),
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException) {
            return [];
        }

        return is_array($metadata) ? $metadata : [];
    }

    private function prepareConfiguredPlaylists(Collection $tracks): Collection
    {
        $tracksByRelativePath = $tracks->keyBy(
            fn (array $track): string => mb_strtolower($track['relative_path'])
        );

        $tracksByFilename = $tracks->groupBy(
            fn (array $track): string => mb_strtolower($track['filename'])
        );

        return collect(config('music.playlists', []))
            ->filter(fn ($playlist): bool => is_array($playlist)
                && isset($playlist['id'], $playlist['name'])
            )
            ->map(function (array $playlist) use (
                $tracks,
                $tracksByRelativePath,
                $tracksByFilename
            ): array {
                $configuredFiles = $playlist['files'] ?? [];

                if ($configuredFiles === '*') {
                    $trackIds = $tracks->pluck('id')->values();
                } else {
                    $trackIds = collect($configuredFiles)
                        ->map(function (string $configuredFile) use (
                            $tracksByRelativePath,
                            $tracksByFilename
                        ): ?string {
                            $normalized = mb_strtolower(ltrim(
                                str_replace('\\', '/', $configuredFile),
                                '/'
                            ));

                            $byPath = $tracksByRelativePath->get($normalized);

                            if (is_array($byPath)) {
                                return $byPath['id'];
                            }

                            $byFilename = $tracksByFilename->get(
                                mb_strtolower(basename($configuredFile))
                            );

                            $firstMatch = $byFilename?->first();

                            return is_array($firstMatch)
                                ? $firstMatch['id']
                                : null;
                        })
                        ->filter()
                        ->unique()
                        ->values();
                }

                $cover = $playlist['cover'] ?? null;

                return [
                    'id' => (string) $playlist['id'],
                    'name' => (string) $playlist['name'],
                    'description' => $playlist['description'] ?? null,
                    'cover_url' => is_string($cover) && $cover !== ''
                        ? asset($this->encodeAssetPath(ltrim($cover, '/\\')))
                        : null,
                    'track_ids' => $trackIds->all(),
                    'track_count' => $trackIds->count(),
                    'source' => 'config',
                ];
            })
            ->filter(fn (array $playlist): bool => $playlist['track_count'] > 0)
            ->values();
    }

    private function relativePublicPath(string $absolutePath): string
    {
        $publicPath = rtrim(str_replace('\\', '/', public_path()), '/');
        $normalized = str_replace('\\', '/', $absolutePath);

        return ltrim(substr($normalized, strlen($publicPath)), '/');
    }

    private function encodeAssetPath(string $path): string
    {
        return collect(explode('/', str_replace('\\', '/', $path)))
            ->map(fn (string $segment): string => rawurlencode($segment))
            ->implode('/');
    }
}
