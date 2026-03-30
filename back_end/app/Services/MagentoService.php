<?php

namespace App\Services;

use App\Models\Commande;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MagentoService
{
    private string $baseUrl;
    private string $token;

    public function __construct()
    {
        $this->baseUrl = config('magento.base_url');
        $this->token   = config('magento.access_token');
    }

    public function fetchNewOrders(): array
    {
        try {
            $response = Http::withToken($this->token)
                ->timeout(30)
                ->withOptions(['verify' => false])
                ->get("{$this->baseUrl}/rest/V1/orders", [
                    'searchCriteria[filter_groups][0][filters][0][field]'          => 'status',
                    'searchCriteria[filter_groups][0][filters][0][value]'          => 'pending',
                    'searchCriteria[filter_groups][0][filters][0][condition_type]' => 'eq',
                    'searchCriteria[sortOrders][0][field]'                         => 'created_at',
                    'searchCriteria[sortOrders][0][direction]'                     => 'DESC',
                    'searchCriteria[pageSize]'                                     => 50,
                ]);

            if (!$response->successful()) {
                Log::error('Magento API error', ['status' => $response->status(), 'body' => $response->body()]);
                return [];
            }

            return $response->json('items') ?? [];

        } catch (\Exception $e) {
            Log::error('Magento fetchNewOrders exception', ['message' => $e->getMessage()]);
            return [];
        }
    }

    public function importOrders(): array
    {
        $magentoOrders = $this->fetchNewOrders();
        $imported = 0;
        $skipped  = 0;

        foreach ($magentoOrders as $order) {
            $sourceId = $order['increment_id'] ?? $order['entity_id'] ?? null;

            if (Commande::where('source_id', $sourceId)->exists()) {
                $skipped++;
                continue;
            }

            $address = $order['extension_attributes']['shipping_assignments'][0]['shipping']['address']
                    ?? $order['billing_address']
                    ?? [];

            $clientNom = trim(
                ($address['firstname'] ?? $order['customer_firstname'] ?? '') . ' ' .
                ($address['lastname']  ?? $order['customer_lastname']  ?? '')
            );

            $clientTelephone = $address['telephone'] ?? '';

            $street = $address['street'] ?? [];
            $clientAdresse = implode(', ', array_filter([
                is_array($street) ? implode(' ', $street) : $street,
                $address['city']     ?? '',
                $address['region']   ?? '',
                $address['postcode'] ?? '',
            ]));

            $articles = collect($order['items'] ?? [])->map(fn($item) => [
                'nom'     => $item['name']         ?? 'Article',
                'sku'     => $item['sku']           ?? '',
                'qty'     => (int) ($item['qty_ordered'] ?? 1),
                'prix'    => (float) ($item['price']  ?? 0),
                'type'    => $item['product_type']  ?? 'simple',
                'fragile' => false,
            ])->toArray();

            Commande::create([
                'client_nom'             => $clientNom ?: 'Client Glotelho',
                'client_telephone'       => $clientTelephone,
                'client_adresse'         => $clientAdresse,
                'latitude'               => null,
                'longitude'              => null,
                'articles'               => $articles,
                'instructions_speciales' => null,
                'statut'                 => 'en_attente',
                'source_id'              => $sourceId,
                'source'                 => 'glotelho_magento',
            ]);

            $imported++;
        }

        Log::info("Magento import: {$imported} importées, {$skipped} ignorées (doublons)");

        return [
            'imported' => $imported,
            'skipped'  => $skipped,
            'total'    => count($magentoOrders),
        ];
    }

    public function testConnection(): bool
    {
        try {
            $response = Http::withToken($this->token)
                ->withOptions([
    'verify' => false,
    'curl'   => [
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_SSLVERSION     => CURL_SSLVERSION_TLSv1_0,
    ],
])
                ->get("{$this->baseUrl}/rest/fr/V1/store/storeViews");

            Log::info('Magento status: ' . $response->status());
            Log::info('Magento body: ' . $response->body());

           Log::info('Magento response', [
                'response' => $response->json(),
                'status' => $response->status()
            ]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Magento exception: ' . $e->getMessage());
            return false;
        }
    }
}