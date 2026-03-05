<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    protected $signature = 'create:admin';
    protected $description = 'Créer un administrateur';

    public function handle()
    {
        User::create([
            'name' => 'Admin Principal',
            'email' => 'admin@glotelho.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);

        $this->info('Admin créé avec succès !');
    }
}