import { NextResponse } from 'next/server';
import { gameDatabase } from '~/lib/gameDatabase';
import { createSecurityMiddleware } from '~/lib/security';

export async function POST(request: Request) {
  try {
    // Aplicar middleware de seguridad
    const securityMiddleware = createSecurityMiddleware();
    const securityResult = await securityMiddleware(request, { 
      ip: request.headers.get('x-forwarded-for') || 'unknown' 
    });

    if ('error' in securityResult) {
      return NextResponse.json(
        { error: securityResult.error },
        { status: securityResult.status }
      );
    }

    const { player, score, mode = 'bet' } = securityResult.body || {};

    if (!player) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Verificar que el player coincida con la sesión
    if (securityResult.session && securityResult.session.playerAddress !== player) {
      return NextResponse.json(
        { error: 'Player address does not match session' },
        { status: 403 }
      );
    }

    // Verificar si el jugador ya tiene un juego activo
    if (gameDatabase.hasActiveGame(player)) {
      return NextResponse.json(
        { error: 'Ya tienes un juego activo' },
        { status: 400 }
      );
    }

    // Crear nuevo juego con el modo especificado
    const newGame = gameDatabase.createGame(player, mode);

    return NextResponse.json({ 
      gameId: newGame.id,
      mode: newGame.mode,
      message: 'Juego creado exitosamente'
    });

  } catch (error) {
    // console.error('Error creating game:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get('player');
  const mode = searchParams.get('mode') as 'practice' | 'bet' | null;
  const stats = searchParams.get('stats') === 'true';

  if (player) {
    if (stats) {
      // Las estadísticas ahora se manejan en el frontend con localStorage
      // Este endpoint se mantiene para compatibilidad pero retorna datos vacíos
      return NextResponse.json({ 
        stats: {
          totalGames: 0,
          bestScore: 0,
          gamesWon: 0,
          totalScore: 0
        }
      });
    } else if (mode) {
      // Obtener juegos de un jugador específico por modo
      const playerGames = gameDatabase.getPlayerGamesByMode(player, mode);
      return NextResponse.json({ games: playerGames });
    } else {
      // Obtener todos los juegos de un jugador
      const playerGames = gameDatabase.getPlayerGames(player);
      return NextResponse.json({ games: playerGames });
    }
  }

  if (mode) {
    // Obtener todos los juegos de un modo específico
    return NextResponse.json({ games: gameDatabase.getGamesByMode(mode) });
  }

  // Obtener todos los juegos
  return NextResponse.json({ games: gameDatabase.getAllGames() });
}

export async function PUT(request: Request) {
  try {
    // Aplicar middleware de seguridad
    const securityMiddleware = createSecurityMiddleware();
    const securityResult = await securityMiddleware(request, { 
      ip: request.headers.get('x-forwarded-for') || 'unknown' 
    });

    if ('error' in securityResult) {
      return NextResponse.json(
        { error: securityResult.error },
        { status: securityResult.status }
      );
    }

    const { gameId, score, status } = securityResult.body || {};

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

    // Verificar que el jugador sea el propietario del juego
    if (securityResult.session && securityResult.session.playerAddress !== game.player) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este juego' },
        { status: 403 }
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
    // console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
