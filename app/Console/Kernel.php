<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

// app/Console/Kernel.php - Agregar comandos
class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\PageBuilderInstall::class,
        Commands\PageBuilderBackup::class,
        Commands\PageBuilderCleanup::class,
        Commands\PageBuilderExport::class,
        Commands\PageBuilderOptimize::class,
        Commands\PageBuilderValidate::class,
    ];

    // Programar tareas automáticas
    protected function schedule(Schedule $schedule)
    {
        // Limpiar archivos temporales diariamente
        $schedule->command('pagebuilder:cleanup')->daily();
        
        // Backup automático semanal
        $schedule->command('pagebuilder:backup --all')->weekly();
        
        // Optimizar páginas publicadas semanalmente
        $schedule->command('pagebuilder:optimize')->weekly();
    }
}