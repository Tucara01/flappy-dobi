import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const playerAddress = searchParams.get('playerAddress');

    // Si se proporciona gameId, verificar ese juego específico
    if (gameId) {
      // Verificar en el backend de bet games
      const betResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/bet?gameId=${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let betGameData = null;
      if (betResponse.ok) {
        betGameData = await betResponse.json();
      }

      // Verificar en gameDatabase
      const { gameDatabase } = await import('../../../../lib/gameDatabase');
      const dbGame = gameDatabase.getGame(parseInt(gameId));

      return NextResponse.json({
        success: true,
        data: {
          gameId: parseInt(gameId),
          betGame: betGameData,
          databaseGame: dbGame,
          summary: {
            betGameStatus: betGameData?.status || 'Not found in bet games',
            databaseStatus: dbGame?.status || 'Not found in database',
            isPending: (betGameData?.status === 'Pending' || dbGame?.status === 'pending'),
            isWon: (betGameData?.status === 'Won' || dbGame?.status === 'won'),
            isLost: (betGameData?.status === 'Lost' || dbGame?.status === 'lost')
          }
        }
      });
    }

    // Si se proporciona playerAddress, buscar todos los juegos de ese jugador
    if (playerAddress) {
      // Obtener todos los juegos de bet
      const betResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/bet`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let allBetGames = [];
      if (betResponse.ok) {
        const betData = await betResponse.json();
        allBetGames = betData.games || [];
      }

      // Filtrar juegos del jugador específico
      const playerGames = allBetGames.filter(game => 
        game.playerAddress && game.playerAddress.toLowerCase() === playerAddress.toLowerCase()
      );

      return NextResponse.json({
        success: true,
        playerAddress,
        betGames: playerGames,
        totalGames: playerGames.length,
        summary: {
          activeGames: playerGames.filter(g => g.status === 'active' || g.status === 'Pending').length,
          wonGames: playerGames.filter(g => g.status === 'Won' || g.status === 'won').length,
          lostGames: playerGames.filter(g => g.status === 'Lost' || g.status === 'lost').length,
          completedGames: playerGames.filter(g => g.status === 'completed' || g.status === 'Won' || g.status === 'Lost').length
        }
      });
    }

    // Si no se proporciona ni gameId ni playerAddress, devolver error
    return NextResponse.json(
      { success: false, error: 'Game ID or Player Address is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error checking game status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
