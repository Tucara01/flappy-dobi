import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Configuración del contrato
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''; // Clave privada del owner
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID';

// ABI del contrato
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
];

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
    const won = score >= 50;
    
    console.log(`Evaluating contract game ${gameId}: score=${score}, won=${won}`);

    // Conectar a la blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Llamar al contrato para establecer el resultado
    const tx = await contract.setResult(gameId, won);
    console.log(`Contract transaction sent: ${tx.hash}`);

    // Esperar a que se confirme la transacción
    const receipt = await tx.wait();
    console.log(`Contract transaction confirmed: ${receipt.hash}`);

    return NextResponse.json({
      success: true,
      data: {
        gameId,
        score,
        won,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      }
    });

  } catch (error) {
    console.error('Error evaluating contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
