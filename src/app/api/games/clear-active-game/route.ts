import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { success: false, error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Limpiar el juego activo del backend de bet
    const betResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/bet`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerAddress })
    });

    let betResult = null;
    if (betResponse.ok) {
      betResult = await betResponse.json();
    }

    // Limpiar de gameDatabase si existe
    const { gameDatabase } = await import('../../../../lib/gameDatabase');
    gameDatabase.releaseActiveGame(playerAddress);

    return NextResponse.json({
      success: true,
      message: 'Active game cleared successfully',
      data: {
        playerAddress,
        betResult,
        cleared: true
      }
    });

  } catch (error) {
    console.error('Error clearing active game:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
