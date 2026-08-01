<?php

use App\Services\Music\PlaylistImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Console\Command\Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'music:import-playlists {source? : مسیر پوشه پلی‌لیست‌ها} {--replace : جایگزینی فایل‌های موجود} {--dry-run : فقط نمایش نتیجه بدون کپی}',
    function (): int {
        $source = (string) (
            $this->argument('source')
            ?: config('music.playlist_import_source', 'D:\\Playlists')
        );

        try {
            $result = app(PlaylistImportService::class)->import(
                $source,
                (bool) $this->option('replace'),
                (bool) $this->option('dry-run')
            );
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return Command::FAILURE;
        }

        $this->newLine();
        $this->info(
            $this->option('dry-run')
                ? 'بررسی آزمایشی با موفقیت انجام شد.'
                : 'پلی‌لیست‌ها با موفقیت انتقال داده شدند.'
        );

        $this->table(
            ['مورد', 'تعداد / مسیر'],
            [
                ['پلی‌لیست‌ها', $result['playlists']],
                ['فایل‌های کپی‌شده', $result['copied']],
                ['فایل‌های ردشده', $result['skipped']],
                ['مقصد', $result['target']],
            ]
        );

        return Command::SUCCESS;
    }
)->purpose('Import playlist folders into public/music/playlists');
