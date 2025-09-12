import { NextRequest, NextResponse } from 'next/server';

// Configuración del contrato
const CONTRACT_ADDRESS = "0xB57e102ecb7646a3a8AC08811e4eB4476f7ad929";
const DOBI_ADDRESS = "0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB";

export async function POST(request: NextRequest) {
  try {
    const { gameId, score, playerAddress } = await request.json();

    if (!gameId || score === undefined || !playerAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verificar que el score sea mayor o igual a 50
    const won = score >= 49;
    
    // console.log(`Evaluating contract game ${gameId}: score=${score}, won=${won}`);

    // Llamar al endpoint interno para establecer el resultado
    const setResultResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/games/set-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        won,
        playerAddress
      })
    });

    if (!setResultResponse.ok) {
      const errorData = await setResultResponse.json();
      throw new Error(`Failed to set result: ${errorData.error}`);
    }

    const resultData = await setResultResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        gameId,
        score,
        won,
        transactionHash: resultData.transactionHash
      }
    });

  } catch (error) {
    // console.error('Error evaluating contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
