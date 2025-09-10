import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';

// ABI del contrato
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
        "internalType": "address",
        "name": "",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
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
        "internalType": "enum FlappyDobiVsScore.GameStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Dirección del contrato (debes reemplazar con la dirección real del contrato desplegado)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Dirección del token USDC (debes reemplazar con la dirección real del USDC)
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000';

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

  // Hook para leer el estado del juego
  const { data: gameData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'games',
    args: activeGameId ? [activeGameId] : undefined,
  });

  // Depositar 1 USDC y crear juego
  const depositAndCreateGame = useCallback(async () => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primero necesitamos aprobar el USDC para el contrato
      const usdcAbi = [
        {
          "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "name": "approve",
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      // Aprobar 1 USDC (1e6 con 6 decimales)
      const approveHash = await writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: usdcAbi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS as `0x${string}`, parseUnits('1', 6)],
      });

      // Esperar a que se confirme la aprobación
      // En una implementación real, deberías esperar aquí

      // Crear el juego (esto deposita el USDC y crea la partida)
      const gameHash = await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
      });

      return gameHash;
    } catch (err) {
      console.error('Error depositing and creating game:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

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

  // Verificar si el jugador tiene un juego activo
  const hasActiveGame = activeGameId && activeGameId > 0;

  // Obtener el estado del juego actual
  const currentGame = gameData ? {
    player: gameData[0],
    status: gameData[1] === 0 ? 'Pending' : 
            gameData[1] === 1 ? 'Won' : 
            gameData[1] === 2 ? 'Lost' : 'Claimed'
  } : null;

  return {
    depositAndCreateGame,
    claimWinnings,
    hasActiveGame,
    currentGame,
    activeGameId: activeGameId ? Number(activeGameId) : null,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    error: error || (writeError ? writeError.message : null),
    contractAddress: CONTRACT_ADDRESS,
    usdcAddress: USDC_ADDRESS,
  };
}
