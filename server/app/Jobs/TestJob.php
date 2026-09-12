<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public string $message = 'Hello from Database Queue!')
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("TestJob processed: {$this->message}");
        dump("🎉 [SUCCESS] TestJob executed by background worker! Message: {$this->message}");
    }
}

