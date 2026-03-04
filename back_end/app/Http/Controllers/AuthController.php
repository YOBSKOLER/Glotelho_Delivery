<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request) {
        $credentials = $request->only("email","password");
        if (!Auth::attempt($credentials)){
            return response()->json(['error'=>'invalid_credentials'],401);          
        }
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;      
        return response()->json(['token'=> $token,'role'=>$user->role,'user'=>$user]);
    }
}
