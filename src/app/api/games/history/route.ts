import { NextRequest, NextResponse } from 'next/server';
import { gameDatabase } from '../../../../lib/gameDatabase';

// Función para cargar juegos desde localStorage (simulando el lado del cliente)
function loadGamesFromStorage() {
  try {
    const PRACTICE_GAMES_KEY = 'flappy-dobi-practice-games';
    const BET_GAMES_KEY = 'flappy-dobi-bet-games';
    
    // En el servidor, no tenemos acceso directo a localStorage del cliente
    // Necesitamos una estrategia diferente
    return { practiceGames: [], betGames: [] };
  } catch (error) {
    console.warn('Error loading games from storage:', error);
    return { practiceGames: [], betGames: [] };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');
    const limit = parseInt(searchParams.get('limit') || '15');

    console.log(`🔍 Fetching game history for: ${playerAddress}`);

    if (!playerAddress) {
      return NextResponse.json(
        { success: false, error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Get all games for the player using the existing method
    const allGames = gameDatabase.getPlayerGames(playerAddress, limit * 2); // Get more to filter
    console.log(`📊 Found ${allGames.length} total games for player`);

    // Filter only completed games (won, lost, or claimed)
    const completedGames = allGames.filter(game => 
      game.status === 'won' || game.status === 'lost' || game.status === 'claimed'
    );
    console.log(`✅ Found ${completedGames.length} completed games`);

    // Take only the requested limit
    const sortedGames = completedGames.slice(0, limit);
    console.log(`📋 Returning ${sortedGames.length} games`);
    
    // Debug: mostrar detalles de los juegos encontrados
    if (sortedGames.length > 0) {
      console.log(`🎮 Games found:`, sortedGames.map(g => ({ id: g.id, mode: g.mode, status: g.status, score: g.score })));
    }

    // Transform to the format expected by the frontend
    const gameHistory = sortedGames.map(game => ({
      gameId: game.id,
      mode: game.mode,
      result: game.status === 'won' ? 'won' : 'lost',
      score: game.score,
      timestamp: new Date(game.createdAt).toISOString(),
      betAmount: game.mode === 'bet' ? 3500 : undefined, // Fixed bet amount for bet games
      rewardAmount: game.status === 'won' && game.mode === 'bet' ? 7000 : undefined, // 2x reward for winning bet games
    }));

    return NextResponse.json({
      success: true,
      data: gameHistory,
      total: gameHistory.length
    });

  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
