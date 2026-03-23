<?php

namespace App\Http\Controllers;

use App\Services\MagentoService;
use Illuminate\Http\Request;

class MagentoController extends Controller
{
    public function __construct(private MagentoService $magento) {}

    // POST /api/admin/magento/import
    // L'admin déclenche manuellement un import
    public function import()
    {
        if (!$this->magento->testConnection()) {
            return response()->json([
                'error' => 'Impossible de se connecter à Magento. Vérifiez la configuration.',
            ], 503);
        }

        $result = $this->magento->importOrders();

        return response()->json([
            'message'  => "{$result['imported']} commande(s) importée(s).",
            'imported' => $result['imported'],
            'skipped'  => $result['skipped'],
            'total'    => $result['total'],
        ]);
    }

    // GET /api/admin/magento/status
    // Vérifie la connexion à Magento
    public function status()
    {
        $connected = $this->magento->testConnection();

        return response()->json([
            'connected' => $connected,
            'message'   => $connected ? 'Connexion Magento OK' : 'Connexion Magento échouée',
        ]);
    }
}