<?php

return [
    /*
    |--------------------------------------------------------------------------
    | URL de base du site Magento (Glotelho)
    |--------------------------------------------------------------------------
    | Exemple: https://www.glotelho.com
    */
    'base_url' => env('MAGENTO_BASE_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | Token d'accès Admin Magento
    |--------------------------------------------------------------------------
    | Récupéré dans Magento Admin → System → Integrations → Access Token
    */
    'access_token' => env('MAGENTO_ACCESS_TOKEN', ''),
];