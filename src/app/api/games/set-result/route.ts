import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';

// Configuración del contrato
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x081bee6c172B4E25A225e29810686343787cED1F";
const DOBI_ADDRESS = "0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB";

// ABI del contrato FlappyDobiVsScore
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "won",
        "type": "bool"
      }
    ],
    "name": "setResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
  }
] as const;

// Cliente público para leer del contrato
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// Cliente con wallet para escribir al contrato
const walletClient = createWalletClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  account: process.env.OWNER_PRIVATE_KEY as `0x${string}`,
});

/**
 * POST /api/games/set-result
 * Establece el resultado de un juego en el contrato inteligente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, won, playerAddress } = body;

    // console.log(`🎯 SET-RESULT API called:`, { gameId, won, playerAddress });

    // Validar datos requeridos
    if (!gameId || won === undefined || !playerAddress) {
      // console.error('❌ Missing required fields:', { gameId, won, playerAddress });
      return NextResponse.json(
        { error: 'Missing required fields: gameId, won, playerAddress' },
        { status: 400 }
      );
    }

    // Verificar que el juego existe y está en estado Pending
    // console.log(`🔍 Reading game data from contract for gameId: ${gameId}`);
    const gameData = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'games',
      args: [BigInt(gameId)],
    });

    // console.log(`📋 Game data from contract:`, gameData);

    if (!gameData) {
      // console.error('❌ Game not found in contract');
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Verificar que el juego está en estado Pending (0)
    if (gameData[1] !== 0) {
      // console.error(`❌ Game already resolved. Status: ${gameData[1]}`);
      return NextResponse.json(
        { error: 'Game already resolved' },
        { status: 400 }
      );
    }

    // Verificar que el jugador es el correcto
    if (gameData[0].toLowerCase() !== playerAddress.toLowerCase()) {
      // console.error(`❌ Player address mismatch. Contract: ${gameData[0]}, Request: ${playerAddress}`);
      return NextResponse.json(
        { error: 'Player address does not match game player' },
        { status: 400 }
      );
    }

    // Establecer el resultado en el contrato
    // console.log(`🚀 Calling setResult on contract: gameId=${gameId}, won=${won}`);
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'setResult',
      args: [BigInt(gameId), won],
    });

    // console.log(`✅ Game ${gameId} result set: ${won ? 'WON' : 'LOST'} - TX: ${hash}`);

    return NextResponse.json({
      success: true,
      message: `Game ${gameId} result set to ${won ? 'WON' : 'LOST'}`,
      gameId: parseInt(gameId),
      won,
      transactionHash: hash
    });

  } catch (error) {
    // console.error('Error setting game result:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/games/set-result?gameId=123
 * Obtiene el estado actual de un juego
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

    // Leer el estado del juego del contrato
    const gameData = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'games',
      args: [BigInt(gameId)],
    });

    const statusNames = ['Pending', 'Won', 'Lost', 'Claimed'];
    const status = statusNames[Number(gameData[1])];

    return NextResponse.json({
      success: true,
      game: {
        gameId: parseInt(gameId),
        player: gameData[0],
        status: status,
        statusCode: Number(gameData[1])
      }
    });

  } catch (error) {
    // console.error('Error getting game status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
