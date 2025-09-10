import { NextResponse } from 'next/server';
import { gameDatabase } from '~/lib/gameDatabase';

export async function POST(request: Request) {
  try {
    const { player, score } = await request.json();

    if (!player) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Verificar si el jugador ya tiene un juego activo
    if (gameDatabase.hasActiveGame(player)) {
      return NextResponse.json(
        { error: 'Ya tienes un juego activo' },
        { status: 400 }
      );
    }

    // Crear nuevo juego
    const newGame = gameDatabase.createGame(player);

    return NextResponse.json({ 
      gameId: newGame.id,
      message: 'Juego creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating game:', error);
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
    // Obtener juegos de un jugador específico
    const playerGames = gameDatabase.getPlayerGames(player);
    return NextResponse.json({ games: playerGames });
  }

  // Obtener todos los juegos
  return NextResponse.json({ games: gameDatabase.getAllGames() });
}

export async function PUT(request: Request) {
  try {
    const { gameId, score, status } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    const game = gameDatabase.getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Juego no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el juego
    const updates: any = {};
    if (score !== undefined) {
      updates.score = score;
    }
    if (status) {
      updates.status = status;
      
      // Si el juego se marca como perdido, liberar el juego activo
      if (status === 'lost') {
        gameDatabase.releaseActiveGame(game.player);
      }
    }

    const updatedGame = gameDatabase.updateGame(gameId, updates);
    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Error actualizando el juego' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      game: updatedGame,
      message: 'Juego actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
