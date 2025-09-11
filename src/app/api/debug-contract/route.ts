import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Configuración del contrato
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x081bee6c172B4E25A225e29810686343787cED1F";

// ABI del contrato FlappyDobiVsScore
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "games",
    "outputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "activeGameOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Cliente público para leer del contrato
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

/**
 * GET /api/debug-contract?playerAddress=0x...
 * Debug endpoint para verificar el estado del contrato
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'playerAddress parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Debugging contract for player: ${playerAddress}`);

    // Obtener el juego activo del jugador
    const activeGameId = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'activeGameOf',
      args: [playerAddress as `0x${string}`],
    });

    console.log(`🎮 Active game ID: ${activeGameId}`);

    if (activeGameId === 0n) {
      return NextResponse.json({
        success: true,
        message: 'No active game found',
        activeGameId: 0,
        gameData: null
      });
    }

    // Obtener los datos del juego
    const gameData = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'games',
      args: [activeGameId],
    });

    const statusNames = ['Pending', 'Won', 'Lost', 'Claimed'];
    const status = statusNames[Number(gameData.status)];

    console.log(`📋 Game data:`, {
      gameId: Number(activeGameId),
      player: gameData.player,
      status: status,
      statusCode: Number(gameData.status)
    });

    return NextResponse.json({
      success: true,
      activeGameId: Number(activeGameId),
      gameData: {
        gameId: Number(activeGameId),
        player: gameData.player,
        status: status,
        statusCode: Number(gameData.status)
      }
    });

  } catch (error) {
    console.error('Error debugging contract:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
