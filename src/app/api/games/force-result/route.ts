import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { gameId, score, playerAddress } = await request.json();

    if (!gameId || score === undefined || !playerAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Determinar si es victoria basado en el score
    const won = score >= 49; // Usar la misma lógica del backend

    // Actualizar el juego en el backend de bet
    const betResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/bet`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        score,
        result: won ? 'won' : 'lost',
        playerAddress
      })
    });

    if (!betResponse.ok) {
      const errorData = await betResponse.json();
      throw new Error(`Failed to update bet game: ${errorData.error}`);
    }

    // También evaluar el contrato si es necesario
    if (won) {
      const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/evaluate-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          score,
          playerAddress
        })
      });

      if (!contractResponse.ok) {
        console.warn('Failed to evaluate contract, but bet game was updated');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Game ${gameId} updated to ${won ? 'WON' : 'LOST'} with score ${score}`,
      data: {
        gameId,
        score,
        won,
        playerAddress
      }
    });

  } catch (error) {
    console.error('Error forcing game result:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
