import { NextRequest, NextResponse } from 'next/server';

// Importar la función para obtener todos los juegos de bet
import { getAllBetGames } from '../games/bet/route';

/**
 * GET /api/debug-games
 * Endpoint de debug para ver todos los juegos registrados
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Getting all bet games');
    
    const allGames = getAllBetGames();
    
    console.log('📊 All bet games:', allGames);
    
    return NextResponse.json({
      success: true,
      totalGames: allGames.length,
      games: allGames,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting debug games:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
