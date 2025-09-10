import { NextResponse } from 'next/server';
import { gameDatabase } from '~/lib/gameDatabase';

export async function POST(request: Request) {
  try {
    const { gameId, player } = await request.json();

    if (!gameId || !player) {
      return NextResponse.json(
        { error: 'Game ID y player address son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el juego
    const game = gameDatabase.getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Juego no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el jugador es el propietario del juego
    if (game.player !== player) {
      return NextResponse.json(
        { error: 'No eres el propietario de este juego' },
        { status: 403 }
      );
    }

    // Verificar que el juego no fue ya reclamado
    if (game.status === 'claimed') {
      return NextResponse.json(
        { error: 'Este premio ya fue reclamado' },
        { status: 400 }
      );
    }

    // Verificar que el juego fue ganado
    if (game.status !== 'won') {
      return NextResponse.json(
        { error: 'Este juego no fue ganado' },
        { status: 400 }
      );
    }

    // Marcar como reclamado
    const updatedGame = gameDatabase.updateGame(gameId, {
      status: 'claimed',
      claimedAt: Date.now()
    });

    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Error actualizando el juego' },
        { status: 500 }
      );
    }

    // Simular la transferencia de USDC (en producción esto sería una transacción real)
    const rewardAmount = 1e6 * 2; // 2 USDC (1 USDC de apuesta + 1 USDC de ganancia)

    return NextResponse.json({
      success: true,
      gameId,
      player,
      rewardAmount,
      claimedAt: updatedGame.claimedAt,
      message: '¡Premio reclamado exitosamente!'
    });

  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get('player');

  if (player) {
    // Obtener los últimos 10 juegos del jugador
    const recentGames = gameDatabase.getPlayerGames(player, 10);
    
    // Obtener juegos reclamables
    const claimableGames = gameDatabase.getClaimableGames(player);
    
    return NextResponse.json({ 
      recentGames,
      claimableGames,
      totalRewards: claimableGames.length * 2 // 2 USDC por juego ganado
    });
  }

  return NextResponse.json({ 
    error: 'Player address is required' 
  }, { status: 400 });
}
