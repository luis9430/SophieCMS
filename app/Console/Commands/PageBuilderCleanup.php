<?php
// app/Console/Commands/PageBuilderCleanup.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class PageBuilderCleanup extends Command
{
    protected $signature = 'pagebuilder:cleanup {--days=7 : Días de archivos temporales a conservar}';
    protected $description = 'Limpiar archivos temporales del Page Builder';

    public function handle()
    {
        $days = (int) $this->option('days');
        $tempPath = storage_path('app/temp');
        $cutoffDate = Carbon::now()->subDays($days);

        if (!File::exists($tempPath)) {
            $this->info('No hay directorio temporal para limpiar');
            return;
        }

        $files = File::files($tempPath);
        $deletedCount = 0;

        foreach ($files as $file) {
            $fileTime = Carbon::createFromTimestamp($file->getMTime());
            
            if ($fileTime->lt($cutoffDate)) {
                File::delete($file->getPathname());
                $deletedCount++;
            }
        }

        $this->info("✓ Limpieza completada. {$deletedCount} archivos eliminados.");
    }
}
