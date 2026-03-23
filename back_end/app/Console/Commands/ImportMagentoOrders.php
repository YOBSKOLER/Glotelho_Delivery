<?php

namespace App\Console\Commands;

use App\Services\MagentoService;
use Illuminate\Console\Command;

class ImportMagentoOrders extends Command
{
    protected $signature   = 'magento:import-orders';
    protected $description = 'Importe les nouvelles commandes depuis Magento (Glotelho)';

    public function handle(MagentoService $magento): void
    {
        $this->info('Connexion à Magento...');

        if (!$magento->testConnection()) {
            $this->error('Impossible de se connecter à Magento. Vérifiez vos credentials dans .env');
            return;
        }

        $this->info('Connexion réussie ! Import des commandes...');

        $result = $magento->importOrders();

        $this->table(
            ['Total Magento', 'Importées', 'Ignorées (doublons)'],
            [[$result['total'], $result['imported'], $result['skipped']]]
        );

        $this->info('Import terminé !');
    }
}