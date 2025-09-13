import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Configuración del contrato
const CONTRACT_ADDRESS = "0x081bee6c172B4E25A225e29810686343787cED1F";

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

// Validar variables de entorno
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const baseRpcUrl = process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/aBT-SG-7Hyy4mOqFF1iBF';

if (!ownerPrivateKey) {
  throw new Error('OWNER_PRIVATE_KEY is not defined in environment variables');
}

// CONTRACT_ADDRESS is now hardcoded, no need to check environment variable

// Validar y formatear la private key
function validateAndFormatPrivateKey(privateKey: string): `0x${string}` {
  const cleanKey = privateKey.trim();
  const formattedKey = cleanKey.startsWith('0x') ? cleanKey : `0x${cleanKey}`;
  
  if (formattedKey.length !== 66) {
    throw new Error(`Invalid private key length: expected 66 characters (including 0x), got ${formattedKey.length}`);
  }
  
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(formattedKey)) {
    throw new Error('Invalid private key format: must be 64 hexadecimal characters with 0x prefix');
  }
  
  return formattedKey as `0x${string}`;
}

// Crear cuenta desde la private key
let account: ReturnType<typeof privateKeyToAccount>;
try {
  const validPrivateKey = validateAndFormatPrivateKey(ownerPrivateKey);
  account = privateKeyToAccount(validPrivateKey);
} catch (error) {
  throw new Error(`Invalid OWNER_PRIVATE_KEY: ${error}`);
}

// Cliente para transacciones (con cuenta que puede firmar)
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(baseRpcUrl),
});

// Cliente para consultas
const publicClient = createPublicClient({
  chain: base,
  transport: http(baseRpcUrl),
});

// Función SIMPLIFICADA para establecer resultado - usa sendTransaction directamente
async function setGameResult(gameId: number, won: boolean) {
  try {
    
    // Verificar balance
    const balance = await publicClient.getBalance({
      address: account.address,
    });

    if (balance === 0n) {
      throw new Error('❌ Balance insuficiente para gas');
    }

    // Encodificar los datos de la función
    const data = encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: 'setResult',
      args: [BigInt(gameId), won],
    });

    // Enviar transacción directamente
    const hash = await walletClient.sendTransaction({
      to: CONTRACT_ADDRESS as `0x${string}`,
      data,
    });

    return { hash };
    
  } catch (error: any) {
    
    if (error.message?.includes('insufficient funds')) {
      throw new Error('Fondos insuficientes para gas');
    }
    
    if (error.message?.includes('Unsupported method')) {
      throw new Error('Configuración de RPC incorrecta');
    }
    
    throw error;
  }
}

// Store para juegos
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
 * POST /api/games/bet - Registra un nuevo juego
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerAddress, contractHash, mode, status } = body;


    if (!gameId || !playerAddress || !contractHash) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, playerAddress, contractHash' },
        { status: 400 }
      );
    }

    betGames.set(gameId, {
      gameId,
      playerAddress,
      contractHash,
      mode: mode || 'bet',
      status: status || 'active',
      createdAt: Date.now()
    });


    return NextResponse.json({
      success: true,
      message: 'Game registered',
      gameId
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/games/bet - Obtiene información de un juego
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/games/bet - Actualiza el estado de un juego
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, score, result, playerAddress, contractHash } = body;


    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    let game = betGames.get(parseInt(gameId));
    
    if (!game) {
      
      game = {
        gameId: parseInt(gameId),
        playerAddress: playerAddress || 'unknown',
        contractHash: contractHash || 'auto-created',
        mode: 'bet',
        status: 'active',
        createdAt: Date.now(),
        score: score || 0,
        result: result || undefined
      };
      
      betGames.set(parseInt(gameId), game);
    }

    // Determinar resultado automáticamente PRIMERO
    let finalResult = result;
    if (score !== undefined && !result) {
      finalResult = score >= 49 ? 'won' : 'lost';
    }

    // Actualizar el juego con el resultado final
    const updatedGame = {
      ...game,
      ...(score !== undefined && { score }),
      ...(finalResult && { result: finalResult }),
      status: finalResult === 'won' || finalResult === 'lost' ? 'completed' : game.status
    };

    betGames.set(parseInt(gameId), updatedGame);

    // Actualizar contrato si hay resultado final
    if (finalResult === 'won' || finalResult === 'lost') {
      if (game.playerAddress && game.playerAddress !== 'unknown') {
        
        const won = finalResult === 'won';
        
        // Ejecutar en background para no bloquear la respuesta
        setGameResult(parseInt(gameId), won)
          .then((result) => {
            // Contrato actualizado exitosamente
          })
          .catch((error) => {
            // Error actualizando contrato
          });
      } else {
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Game updated successfully',
      game: updatedGame
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/games/bet - Limpiar juego activo de un jugador
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerAddress } = body;

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Buscar y eliminar el juego activo del jugador
    let gameRemoved = false;
    for (const [gameId, game] of betGames.entries()) {
      if (game.playerAddress === playerAddress) {
        betGames.delete(gameId);
        gameRemoved = true;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      message: gameRemoved ? 'Active game cleared' : 'No active game found',
      gameRemoved
    });

  } catch (error) {
    console.error('Error clearing active game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Función para obtener todos los juegos de bet (para estadísticas)
 * Esta función es interna y no se exporta para evitar conflictos con Next.js
 */
function getAllBetGames() {
  return Array.from(betGames.values());
}
