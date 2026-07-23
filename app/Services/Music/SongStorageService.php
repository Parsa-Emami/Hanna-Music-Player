<?php

namespace App\Services\Music;

use App\Models\Song;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class SongStorageService
{
    private string $disk = 'public';

    /**
     * @return array{
     *     disk: string,
     *     audio_path: string,
     *     cover_path: string|null,
     *     original_name: string,
     *     mime_type: string|null,
     *     size: int
     * }
     */
    public function store(
        UploadedFile $audio,
        ?UploadedFile $cover = null
    ): array {
        $folder = now()->format('Y/m');

        $audioPath = $audio->store(
            "music/audio/{$folder}",
            $this->disk
        );

        if (! is_string($audioPath)) {
            throw new RuntimeException(
                'ذخیره فایل موسیقی ناموفق بود.'
            );
        }

        $coverPath = null;

        try {
            if ($cover) {
                $coverPath = $cover->store(
                    "music/covers/{$folder}",
                    $this->disk
                );

                if (! is_string($coverPath)) {
                    throw new RuntimeException(
                        'ذخیره تصویر کاور ناموفق بود.'
                    );
                }
            }
        } catch (Throwable $exception) {
            Storage::disk($this->disk)->delete($audioPath);

            throw $exception;
        }

        return [
            'disk' => $this->disk,
            'audio_path' => $audioPath,
            'cover_path' => $coverPath,
            'original_name' => $audio->getClientOriginalName(),
            'mime_type' => $audio->getMimeType(),
            'size' => $audio->getSize() ?: 0,
        ];
    }

    public function deleteSongFiles(Song $song): void
    {
        $this->deletePaths(
            $song->storage_disk ?: 'public',
            [
                $song->audio_path,
                $song->cover_path,
            ]
        );
    }

    public function deletePaths(string $disk, array $paths): void
    {
        $paths = array_values(array_filter($paths));

        if ($paths !== []) {
            Storage::disk($disk)->delete($paths);
        }
    }
}