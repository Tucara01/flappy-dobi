import { NextRequest, NextResponse } from 'next/server';

// Store para juegos de bet mode (en producción usarías una base de datos)
const betGames = new Map<number, {
  gameId: number;
  playerAddress: string;
  contractHash: string;
  mode: string;
  status: string;
  createdAt: number;
  score?: number;
  result?: 'won' | 'lost';
}>();

/**
 * POST /api/games/bet
 * Registra un nuevo juego de bet mode para monitoreo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerAddress, contractHash, mode, status } = body;

    // Validar datos requeridos
    if (!gameId || !playerAddress || !contractHash) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, playerAddress, contractHash' },
        { status: 400 }
      );
    }

    // Registrar el juego para monitoreo
    betGames.set(gameId, {
      gameId,
      playerAddress,
      contractHash,
      mode: mode || 'bet',
      status: status || 'active',
      createdAt: Date.now()
    });

    console.log(`Bet game registered: ID ${gameId}, Player: ${playerAddress}`);

    return NextResponse.json({
      success: true,
      message: 'Bet game registered for monitoring',
      gameId
    });

  } catch (error) {
    console.error('Error registering bet game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/games/bet
 * Obtiene información de un juego de bet mode
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId parameter is required' },
        { status: 400 }
      );
    }

    const game = betGames.get(parseInt(gameId));
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game
    });

  } catch (error) {
    console.error('Error getting bet game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/games/bet
 * Actualiza el estado de un juego de bet mode (score, result)
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔔 PUT /api/games/bet - Request received');
    const body = await request.json();
    const { gameId, score, result } = body;

    console.log('📋 Request body:', { gameId, score, result });

    if (!gameId) {
      console.error('❌ Missing gameId in request');
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for game with ID: ${gameId}`);
    const game = betGames.get(parseInt(gameId));
    
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`);
      console.log('📊 Available games:', Array.from(betGames.keys()));
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    console.log('✅ Game found:', game);

    // Actualizar el juego
    const updatedGame = {
      ...game,
      ...(score !== undefined && { score }),
      ...(result && { result }),
      status: result === 'won' ? 'completed' : result === 'lost' ? 'completed' : game.status
    };

    betGames.set(parseInt(gameId), updatedGame);

    console.log(`✅ Bet game updated: ID ${gameId}, Score: ${score}, Result: ${result}`);
    console.log('📊 Updated game:', updatedGame);

    // Si hay un resultado (won/lost), notificar al contrato inteligente
    if (result === 'won' || result === 'lost') {
      try {
        console.log(`🔔 Notifying smart contract: Game ${gameId} ${result}`);
        console.log(`📊 Game details:`, updatedGame);
        
        const setResultPayload = {
          gameId: parseInt(gameId),
          won: result === 'won',
          playerAddress: game.playerAddress
        };
        
        console.log('📤 Calling set-result API with payload:', setResultPayload);
        
        // Llamar al endpoint de set-result para actualizar el contrato
        const setResultUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/set-result`;
        console.log('🌐 Set-result URL:', setResultUrl);
        
        const setResultResponse = await fetch(setResultUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(setResultPayload)
        });

        console.log('📥 Set-result response status:', setResultResponse.status);
        console.log('📥 Set-result response ok:', setResultResponse.ok);

        if (setResultResponse.ok) {
          const setResultData = await setResultResponse.json();
          console.log(`✅ Smart contract updated successfully:`, setResultData);
        } else {
          const errorData = await setResultResponse.json();
          console.error(`❌ Failed to update smart contract:`, errorData);
        }
      } catch (error) {
        console.error(`❌ Error updating smart contract:`, error);
      }
    } else {
      console.log('ℹ️ No result to notify to smart contract');
    }

    return NextResponse.json({
      success: true,
      message: 'Game updated successfully',
      game: updatedGame
    });

  } catch (error) {
    console.error('Error updating bet game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Función para obtener todos los juegos de bet mode (para debugging)
 */
export function getAllBetGames() {
  return Array.from(betGames.values());
}
