<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSongRequest;
use App\Models\Song;
use App\Services\Music\SongStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class SongController extends Controller
{
    public function store(
        StoreSongRequest $request,
        SongStorageService $storage
    ): RedirectResponse {
        $validated = $request->validated();

        $files = $storage->store(
            $request->file('audio'),
            $request->file('cover')
        );

        try {
            DB::transaction(function () use (
                $validated,
                $files
            ): void {
                Song::create([
                    'title' => $validated['title'],

                    'slug' => $this->uniqueSlug(
                        $validated['title']
                    ),

                    'storage_disk' => $files['disk'],
                    'audio_path' => $files['audio_path'],

                    'audio_original_name' =>
                        $files['original_name'],

                    'audio_mime_type' =>
                        $files['mime_type'],

                    'audio_size' =>
                        $files['size'],

                    'cover_path' =>
                        $files['cover_path'],

                    'duration_seconds' =>
                        $validated['duration_seconds'] ?? 0,

                    'is_active' => true,
                    'play_count' => 0,
                ]);
            });
        } catch (Throwable $exception) {
            $storage->deletePaths(
                $files['disk'],
                [
                    $files['audio_path'],
                    $files['cover_path'],
                ]
            );

            throw $exception;
        }

        return back()->with(
            'success',
            'آهنگ با موفقیت آپلود شد.'
        );
    }

    public function destroy(
        Song $song,
        SongStorageService $storage
    ): RedirectResponse {
        $storage->deleteSongFiles($song);

        $song->delete();

        return back()->with(
            'success',
            'آهنگ حذف شد.'
        );
    }

    private function uniqueSlug(string $title): string
    {
        $baseSlug = Str::slug($title);

        if ($baseSlug === '') {
            $baseSlug = 'song-'.Str::lower(
                Str::random(10)
            );
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Song::query()
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}