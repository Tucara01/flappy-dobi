import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
  }
] as const;

// Usar la address directamente y private key desde .env.local
const ownerAddress = "0xAE524b1DB53B1C005BD4A7c301E89855a2323e34";
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
console.log(`🔑 Owner address: ${ownerAddress}`);

if (!ownerPrivateKey) {
  throw new Error('OWNER_PRIVATE_KEY is not defined in environment variables');
}

// Convertir la private key a una account válida para firmar
const ownerAccount = privateKeyToAccount(ownerPrivateKey as `0x${string}`);

// Cliente con wallet para escribir al contrato (usando la cuenta del owner)
const walletClient = createWalletClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  account: ownerAccount,
});

// Función para establecer el resultado del juego en el contrato inteligente
async function setGameResult(gameId: number, won: boolean) {
  try {
    console.log(`🎯 Estableciendo juego ${gameId} como ${won ? 'GANADO' : 'PERDIDO'}...`);
    
    const setResultTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'setResult',
      args: [BigInt(gameId), won],
      account: ownerAccount,
    });

    console.log(`⏳ TX enviada: ${setResultTx}`);
    console.log(`✅ Juego ${gameId} marcado como ${won ? 'GANADO' : 'PERDIDO'}`);
    
    return setResultTx;
  } catch (error) {
    console.error('❌ Error estableciendo resultado:', error);
    throw error;
  }
}

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
    console.log('🔔 POST /api/games/bet - Game registration request received');
    const body = await request.json();
    const { gameId, playerAddress, contractHash, mode, status } = body;

    console.log('📋 Registration request body:', { gameId, playerAddress, contractHash, mode, status });

    // Validar datos requeridos
    if (!gameId || !playerAddress || !contractHash) {
      console.error('❌ Missing required fields:', { gameId, playerAddress, contractHash });
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

    console.log(`✅ Bet game registered: ID ${gameId}, Player: ${playerAddress}`);
    console.log('📊 Current games in backend:', Array.from(betGames.keys()));

    return NextResponse.json({
      success: true,
      message: 'Bet game registered for monitoring',
      gameId
    });

  } catch (error) {
    console.error('❌ Error registering bet game:', error);
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
    const { gameId, score, result, playerAddress, contractHash } = body;

    console.log('📋 Request body:', { gameId, score, result, playerAddress, contractHash });
    console.log('🎮 Game ID type:', typeof gameId, 'Value:', gameId);

    if (!gameId) {
      console.error('❌ Missing gameId in request');
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for game with ID: ${gameId}`);
    let game = betGames.get(parseInt(gameId));
    
    if (!game) {
      console.log(`⚠️ Game not found: ${gameId}, creating it automatically...`);
      console.log('📊 Available games:', Array.from(betGames.keys()));
      
      // Crear el juego automáticamente si no existe
      game = {
        gameId: parseInt(gameId),
        playerAddress: playerAddress || 'unknown', // Usar la dirección del jugador del request
        contractHash: contractHash || 'auto-created', // Usar el hash del contrato del request
        mode: 'bet',
        status: 'active',
        createdAt: Date.now(),
        score: score || 0,
        result: result || undefined
      };
      
      betGames.set(parseInt(gameId), game);
      console.log(`✅ Game created automatically:`, game);
    } else {
      console.log('✅ Game found:', game);
    }

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

    // Determinar automáticamente si el jugador ganó o perdió basado en el score
    let finalResult = result;
    if (score !== undefined && !result) {
      // Si no hay resultado explícito pero hay score, determinar automáticamente
      finalResult = score >= 50 ? 'won' : 'lost';
      console.log(`🎯 Auto-determining result: score ${score} = ${finalResult}`);
      
      // Actualizar el juego con el resultado determinado
      const autoUpdatedGame = {
        ...updatedGame,
        result: finalResult,
        status: 'completed'
      };
      betGames.set(parseInt(gameId), autoUpdatedGame);
      console.log(`✅ Game auto-updated with result: ${finalResult}`);
    }

    // Si hay un resultado (won/lost), actualizar el contrato inteligente directamente
    if (finalResult === 'won' || finalResult === 'lost') {
      // Solo actualizar el contrato si tenemos información del jugador
      if (game.playerAddress && game.playerAddress !== 'unknown') {
        try {
          console.log(`🔔 Updating smart contract directly: Game ${gameId} ${finalResult}`);
          console.log(`📊 Game details:`, updatedGame);
          
          const won = finalResult === 'won';
          const resultText = won ? 'GANADO' : 'PERDIDO';
          
          console.log(`🎯 Estableciendo juego ${gameId} como ${resultText}...`);
          
          // Llamar directamente al contrato inteligente usando la cuenta del owner
          const setResultTx = await setGameResult(parseInt(gameId), won);
          
          if (setResultTx) {
            console.log(`⏳ TX enviada: ${setResultTx}`);
            console.log(`✅ Juego ${gameId} marcado como ${resultText} en el contrato`);
          } else {
            console.error(`❌ Failed to update smart contract for game ${gameId}`);
          }
        } catch (error) {
          console.error(`❌ Error updating smart contract:`, error);
        }
      } else {
        console.log(`⚠️ Game ${gameId} has no player address, skipping smart contract update`);
        console.log(`ℹ️ Smart contract will be updated when the game is properly registered`);
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
