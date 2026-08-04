<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Session-based authentication for the React SPA.
 *
 * Uses Sanctum's stateful (cookie) mode rather than bearer tokens, so the
 * client must call /sanctum/csrf-cookie before posting to /login.
 */
class AuthController extends Controller
{
    /**
     * Sign a user in and start a session.
     */
    public function login (Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            // Reported against `email` so the SPA can render it under the field.
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Guards against session fixation: the pre-login session id is discarded.
        $request->session()->regenerate();

        return response()->json([
            'data' => $this->userPayload($request->user()),
        ]);
    }

    /**
     * Sign the current user out and drop the session.
     */
    public function logout (Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    /**
     * The signed-in user, used by the SPA on boot to restore a session.
     */
    public function me (Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->userPayload($request->user()),
        ]);
    }

    /**
     * Shape of the user the SPA consumes.
     *
     * `role` is the first assigned role and is what the client routes on;
     * `roles` carries the full list for users who end up with more than one.
     *
     * @return array<string, mixed>
     */
    private function userPayload (User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
            'roles' => $user->getRoleNames()->all(),
        ];
    }
}
