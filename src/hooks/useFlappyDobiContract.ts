import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// ABI del contrato FlappyDobiVsScore
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdc",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "createGame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
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
    "name": "claimWinnings",
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
  },
  {
    "inputs": [],
    "name": "betAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextGameId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "from",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "to",
        "type": "uint256"
      }
    ],
    "name": "listGames",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "enum FlappyDobiVsScore.GameStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct FlappyDobiVsScore.Game[]",
        "name": "result",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Direcciones del contrato (usando DOBI en lugar de USDC)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x081bee6c172B4E25A225e29810686343787cED1F";
const DOBI_ADDRESS = "0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB"; // DOBI token address

// ABI del token DOBI
const DOBI_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface GameStatus {
  Pending: 0;
  Won: 1;
  Lost: 2;
  Claimed: 3;
}

export interface Game {
  player: string;
  status: keyof GameStatus;
}

export function useFlappyDobiContract() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractGameId, setContractGameId] = useState<number | null>(null);

  // Crear cliente público para leer del contrato
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  // Hook para escribir al contrato
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  // Hook para esperar la confirmación de la transacción
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Hook para leer el juego activo del jugador
  const { data: activeGameId } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'activeGameOf',
    args: address ? [address] : undefined,
  });

  // Actualizar contractGameId cuando se confirme la transacción
  useEffect(() => {
    if (isConfirmed && activeGameId) {
      console.log('🎯 Transaction confirmed, updating contract game ID:', activeGameId);
      setContractGameId(Number(activeGameId));
      
      // Notificar al backend sobre el nuevo juego de bet mode
      if (address && hash) {
        registerGameWithBackend(Number(activeGameId), hash as string);
      }
    }
  }, [isConfirmed, activeGameId, address, hash]);

  // Función para registrar el juego con el backend
  const registerGameWithBackend = async (gameId: number, transactionHash: string) => {
    try {
      const registrationPayload = {
        gameId: gameId,
        playerAddress: address,
        contractHash: transactionHash,
        mode: 'bet',
        status: 'active'
      };
      
      console.log('📤 Registering bet game with backend:', registrationPayload);
      
      const response = await fetch('/api/games/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Bet game registered with backend successfully:', responseData);
      } else {
        const errorText = await response.text();
        console.warn('❌ Failed to register bet game with backend:', errorText);
      }
    } catch (error) {
      console.error('❌ Error registering bet game with backend:', error);
    }
  };

  // Hook para leer el estado del juego
  const { data: gameData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'games',
    args: activeGameId ? [activeGameId] : undefined,
  });

  // Hook para leer el bet amount
  const { data: betAmount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'betAmount',
  });

  // Usar el bet amount del contrato o el valor por defecto
  const actualBetAmount = betAmount || BigInt(3500 * 1e18); // 3500 DOBI con 18 decimales
  
  console.log('Bet amount from contract:', betAmount);
  console.log('Actual bet amount:', actualBetAmount);
  console.log('Bet amount in DOBI:', actualBetAmount ? Number(actualBetAmount) / 1e18 : 3500);

  // Hook para leer el balance de DOBI del usuario
  const { data: userDobiBalance } = useReadContract({
    address: DOBI_ADDRESS as `0x${string}`,
    abi: DOBI_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Hook para leer la allowance de DOBI
  const { data: userDobiAllowance } = useReadContract({
    address: DOBI_ADDRESS as `0x${string}`,
    abi: DOBI_ABI,
    functionName: 'allowance',
    args: address && CONTRACT_ADDRESS ? [address, CONTRACT_ADDRESS as `0x${string}`] : undefined,
  });

  // Aprobar DOBI tokens
  const approveDobi = useCallback(async () => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    if (!actualBetAmount) {
      setError('Bet amount not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Aprobar una cantidad mayor para evitar múltiples aprobaciones
      const approveAmount = actualBetAmount * BigInt(10); // 10x el bet amount
      
      const hash = await writeContract({
        address: DOBI_ADDRESS as `0x${string}`,
        abi: DOBI_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS as `0x${string}`, approveAmount],
      });

      return hash;
    } catch (err) {
      console.error('Error approving DOBI:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, actualBetAmount, writeContract]);

  // Crear juego (esto automáticamente transfiere DOBI)
  const createGame = useCallback(async () => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
      });

      console.log('🎮 Game creation transaction initiated');

      // Retornar el hash actual si existe, sino esperar a que se actualice
      if (hash) {
        return { hash, gameId: 0 }; // Temporal, se actualizará cuando se confirme
      }

      return null;
    } catch (err) {
      console.error('Error creating game:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract, hash]);

  // Reclamar premio
  const claimWinnings = useCallback(async (gameId: number) => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(gameId)],
      });

      return hash;
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Establecer resultado del juego (solo para owner)
  const setGameResult = useCallback(async (gameId: number, won: boolean) => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'setResult',
        args: [BigInt(gameId), won],
      });

      return hash;
    } catch (err) {
      console.error('Error setting game result:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Verificar si el jugador tiene un juego activo
  const hasActiveGame = activeGameId && activeGameId > 0;

  // Obtener el estado del juego actual
  const currentGame = gameData ? {
    player: gameData[0],
    status: gameData[1] === 0 ? 'Pending' : 
            gameData[1] === 1 ? 'Won' : 
            gameData[1] === 2 ? 'Lost' : 'Claimed'
  } : null;

  // Verificar si tiene suficiente allowance
  const hasEnoughAllowance = userDobiAllowance && actualBetAmount ? userDobiAllowance >= actualBetAmount : false;

  return {
    // Funciones principales
    approveDobi,
    createGame,
    claimWinnings,
    setGameResult,
    
    // Estado del juego
    hasActiveGame,
    currentGame,
    activeGameId: activeGameId ? Number(activeGameId) : null,
    contractGameId,
    
    // Estado de la transacción
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    error: error || (writeError ? writeError.message : null),
    
    // Información del contrato
    contractAddress: CONTRACT_ADDRESS,
    dobiAddress: DOBI_ADDRESS,
    betAmount: 3500, // 3500 DOBI fijo según el contrato
    
    // Información del usuario
    userDobiBalance: userDobiBalance ? Number(userDobiBalance) : 0,
    userDobiAllowance: userDobiAllowance ? Number(userDobiAllowance) : 0,
    hasEnoughAllowance,
  };
}