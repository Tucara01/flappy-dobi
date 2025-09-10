import { NextResponse } from 'next/server';
import { gameDatabase } from '~/lib/gameDatabase';

export async function GET() {
  try {
    // Test the game database
    const testGame = gameDatabase.createGame('test-player');
    const allGames = gameDatabase.getAllGames();
    
    return NextResponse.json({
      success: true,
      message: 'API is working',
      testGame,
      totalGames: allGames.length,
      games: allGames
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
