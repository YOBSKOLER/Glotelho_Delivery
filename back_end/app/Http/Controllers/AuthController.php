<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;

use Illuminate\Support\Str;    

class AuthController extends Controller 
{
    public function login(Request $request) {
        $credentials = $request->only("email","password");
        if (!Auth::attempt($credentials)){
            return response()->json(['error'=>'Mot de passe ou email incorrect'],401);          
        }
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;      
        return response()->json(['token'=> $token,'role'=>$user->role,'user'=>$user]);
    }

    public function forgotPassword(Request $request){
        $request->validate(['email'=>'required|email']);
        $status=Password::sendResetLink($request->only('email'));
        return $status === Password::RESET_LINK_SENT
        ? response()->json(['message'=>'Reset link sent to your email.'])   
        : response()->json(['error'=>'Failed to send reset link.'], 500);
    }
   public function resetPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'token' => 'required',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user) use ($request) {
            $user->forceFill([
                'password' => Hash::make($request->password)
            ])->save();

            event(new PasswordReset($user));
        }
    );

    return response()->json([
        'message' => __($status)
    ]);
}
}
