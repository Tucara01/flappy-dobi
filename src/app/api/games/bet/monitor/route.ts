import { NextRequest, NextResponse } from 'next/server';

// Simulamos el almacenamiento de juegos de bet (en producción esto sería una base de datos)
const betGames = new Map<number, any>();

/**
 * GET /api/games/bet/monitor
 * Endpoint para que el backend monitoree todos los juegos de bet mode
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'completed', 'all'
    
    const allGames = Array.from(betGames.values());
    
    let filteredGames = allGames;
    
    if (status && status !== 'all') {
      filteredGames = allGames.filter(game => game.status === status);
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    filteredGames.sort((a, b) => b.createdAt - a.createdAt);
    
    return NextResponse.json({
      success: true,
      games: filteredGames,
      total: filteredGames.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error monitoring bet games:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games/bet/monitor
 * Endpoint para que el backend actualice el estado de múltiples juegos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body; // Array de { gameId, score, result }
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates must be an array' },
        { status: 400 }
      );
    }
    
    const results = [];
    
    for (const update of updates) {
      const { gameId, score, result } = update;
      
      if (!gameId) {
        results.push({ gameId, success: false, error: 'gameId is required' });
        continue;
      }
      
      try {
        // Simular actualización del juego
        // En una implementación real, esto actualizaría la base de datos
        results.push({
          gameId,
          success: true,
          message: 'Game updated successfully',
          score,
          result
        });
      } catch (error) {
        results.push({
          gameId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      updated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error updating bet games:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
