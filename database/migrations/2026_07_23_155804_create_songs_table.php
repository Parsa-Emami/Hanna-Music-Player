<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('songs', function (Blueprint $table) {
            $table->id();

            $table->string('title', 180);
            $table->string('slug')->unique();

            $table->string('storage_disk', 50)
                ->default('public');

            $table->string('audio_path');

            $table->string('audio_original_name')
                ->nullable();

            $table->string('audio_mime_type', 100)
                ->nullable();

            $table->unsignedBigInteger('audio_size')
                ->default(0);

            $table->string('cover_path')
                ->nullable();

            $table->unsignedInteger('duration_seconds')
                ->default(0);

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->unsignedBigInteger('play_count')
                ->default(0);

            $table->timestamps();

            $table->index('title');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('songs');
    }
};