<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('playlist_song', function (Blueprint $table) {
            $table->id();

            $table->foreignId('playlist_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('song_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unsignedInteger('position')
                ->default(0);

            $table->timestamps();

            $table->unique([
                'playlist_id',
                'song_id',
            ]);

            $table->index([
                'playlist_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('playlist_song');
    }
};