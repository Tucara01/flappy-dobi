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

// Validar y formatear la private key
function validateAndFormatPrivateKey(privateKey: string): `0x${string}` {
  const cleanKey = privateKey.trim();
  const formattedKey = cleanKey.startsWith('0x') ? cleanKey : `0x${cleanKey}`;
  
  if (formattedKey.length !== 66) {
    throw new Error(`Invalid private key length: expected 66 characters (including 0x), got ${formattedKey.length}`);
  }
  
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(formattedKey)) {
    throw new Error('Invalid private key format: must contain only hexadecimal characters');
  }
  
  return formattedKey as `0x${string}`;
}

// Crear cliente de wallet
const account = privateKeyToAccount(validateAndFormatPrivateKey(ownerPrivateKey));

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(baseRpcUrl)
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(baseRpcUrl)
});

export async function POST(request: NextRequest) {
  try {
    const { gameId, won } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Game ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Forcing contract update: Game ${gameId} = ${won ? 'WON' : 'LOST'}`);

    // Codificar la función setResult
    const data = encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: 'setResult',
      args: [BigInt(gameId), won || false],
    });

    // Enviar transacción
    const hash = await walletClient.sendTransaction({
      to: CONTRACT_ADDRESS as `0x${string}`,
      data,
      value: 0n,
    });

    console.log(`📤 Transaction sent: ${hash}`);

    // Esperar confirmación
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log(`✅ Contract updated successfully: ${hash}`);
      return NextResponse.json({
        success: true,
        message: `Game ${gameId} updated to ${won ? 'WON' : 'LOST'}`,
        transactionHash: hash,
        receipt
      });
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ Error updating contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
