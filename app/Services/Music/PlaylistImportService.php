<?php

namespace App\Services\Music;

use Illuminate\Support\Facades\File;
use RuntimeException;

class PlaylistImportService
{
    /**
     * @return array{playlists: int, copied: int, skipped: int, target: string}
     */
    public function import(
        string $source,
        bool $replace = false,
        bool $dryRun = false
    ): array {
        $source = $this->normalizeInputPath($source);

        if (! File::isDirectory($source)) {
            throw new RuntimeException(
                "پوشه مبدا پیدا نشد: {$source}"
            );
        }

        $targetRoot = public_path(trim(
            config('music.playlists_directory', 'music/playlists'),
            '/\\'
        ));

        if (! $dryRun) {
            File::ensureDirectoryExists($targetRoot);
        }

        $sourceRealPath = realpath($source) ?: $source;
        $targetRealPath = realpath($targetRoot) ?: $targetRoot;

        if ($this->samePath($sourceRealPath, $targetRealPath)) {
            throw new RuntimeException(
                'پوشه مبدا و مقصد نمی‌توانند یکسان باشند.'
            );
        }

        $playlistSources = collect(File::directories($source))
            ->sort(fn (string $a, string $b): int => strnatcasecmp(
                basename($a),
                basename($b)
            ))
            ->values();

        if ($this->hasAudioFilesDirectly($source)) {
            $playlistSources->prepend($source);
        }

        if ($playlistSources->isEmpty()) {
            throw new RuntimeException(
                'هیچ پوشه پلی‌لیست یا فایل صوتی در مبدا پیدا نشد.'
            );
        }

        $result = [
            'playlists' => 0,
            'copied' => 0,
            'skipped' => 0,
            'target' => $targetRoot,
        ];

        foreach ($playlistSources as $playlistSource) {
            $folderName = $playlistSource === $source
                ? $this->safeFolderName(basename(rtrim($source, '/\\')))
                : $this->safeFolderName(basename($playlistSource));

            $playlistTarget = $targetRoot.DIRECTORY_SEPARATOR.$folderName;

            if ($replace && File::isDirectory($playlistTarget) && ! $dryRun) {
                File::deleteDirectory($playlistTarget);
            }

            if (! $dryRun) {
                File::ensureDirectoryExists($playlistTarget);
            }

            foreach (File::allFiles($playlistSource) as $file) {
                if ($this->shouldIgnore($file->getFilename())) {
                    continue;
                }

                $relativePath = ltrim(str_replace(
                    '\\',
                    '/',
                    $file->getRelativePathname()
                ), '/');

                // هنگام واردکردن فایل‌های مستقیم مبدا، زیرپوشه‌های آن دوباره کپی نشوند.
                if (
                    $playlistSource === $source
                    && str_contains($relativePath, '/')
                ) {
                    continue;
                }

                $destination = $playlistTarget
                    .DIRECTORY_SEPARATOR
                    .str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

                if (File::exists($destination) && ! $replace) {
                    $result['skipped']++;
                    continue;
                }

                if (! $dryRun) {
                    File::ensureDirectoryExists(dirname($destination));

                    if (! File::copy($file->getPathname(), $destination)) {
                        throw new RuntimeException(
                            "کپی فایل ناموفق بود: {$relativePath}"
                        );
                    }
                }

                $result['copied']++;
            }

            $result['playlists']++;
        }

        return $result;
    }

    private function hasAudioFilesDirectly(string $directory): bool
    {
        $allowed = collect(config('music.allowed_extensions', []))
            ->map(fn (string $extension): string => mb_strtolower($extension))
            ->all();

        return collect(File::files($directory))->contains(
            fn ($file): bool => in_array(
                mb_strtolower($file->getExtension()),
                $allowed,
                true
            )
        );
    }

    private function normalizeInputPath(string $path): string
    {
        return rtrim(trim($path, " \t\n\r\0\x0B\"'"), '/\\');
    }

    private function safeFolderName(string $name): string
    {
        $name = trim(preg_replace('/[<>:"\/\\|?*]+/u', '-', $name) ?? '');

        return $name !== '' ? $name : 'Imported Playlist';
    }

    private function shouldIgnore(string $filename): bool
    {
        return in_array(mb_strtolower($filename), [
            'desktop.ini',
            'thumbs.db',
            '.ds_store',
        ], true);
    }

    private function samePath(string $first, string $second): bool
    {
        $normalize = static fn (string $path): string => mb_strtolower(
            rtrim(str_replace('\\', '/', $path), '/')
        );

        return $normalize($first) === $normalize($second);
    }
}
