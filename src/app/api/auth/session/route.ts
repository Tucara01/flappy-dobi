import { NextResponse } from 'next/server';
import { createGameSession, validateApiKey } from '~/lib/security';

export async function POST(request: Request) {
  try {
    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Validar API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Crear nueva sesión de juego
    const session = createGameSession(playerAddress);

    return NextResponse.json({
      sessionId: session.sessionId,
      playerAddress: session.playerAddress,
      createdAt: session.createdAt,
      message: 'Game session created successfully'
    });

  } catch (error) {
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
