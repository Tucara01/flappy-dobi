const { ethers } = require('ethers');

// Configuración para red local (Hardhat/Anvil)
const RPC_URL = 'http://127.0.0.1:8545'; // Puerto por defecto de Hardhat
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Clave privada de Hardhat #0

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
];

// ABI del token USDC (simulado)
const USDC_ABI = [
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
  }
];

async function testContract() {
  try {
    console.log('🚀 Iniciando pruebas del contrato...\n');

    // Conectar a la red local
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📡 Conectado a red local');
    console.log('👤 Wallet:', wallet.address);
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH\n');

    // Direcciones (debes reemplazar con las reales después del despliegue)
    const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Reemplazar con la dirección real
    const USDC_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // Reemplazar con la dirección real

    // Crear instancias de los contratos
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    console.log('📋 Contrato FlappyDobiVsScore:', CONTRACT_ADDRESS);
    console.log('💵 Token USDC:', USDC_ADDRESS);

    // Verificar balance de USDC
    const usdcBalance = await usdc.balanceOf(wallet.address);
    console.log('💵 Balance USDC:', ethers.formatUnits(usdcBalance, 6), 'USDC\n');

    // 1. Aprobar USDC para el contrato
    console.log('1️⃣ Aprobando 1 USDC para el contrato...');
    const approveTx = await usdc.approve(CONTRACT_ADDRESS, ethers.parseUnits('1', 6));
    await approveTx.wait();
    console.log('✅ USDC aprobado\n');

    // 2. Crear juego
    console.log('2️⃣ Creando juego...');
    const createGameTx = await contract.createGame();
    const receipt = await createGameTx.wait();
    console.log('✅ Juego creado');
    console.log('📝 Transaction hash:', createGameTx.hash);
    console.log('🎮 Game ID:', receipt.logs[0].args.gameId.toString());

    const gameId = receipt.logs[0].args.gameId.toString();
    console.log('');

    // 3. Verificar estado del juego
    console.log('3️⃣ Verificando estado del juego...');
    const gameData = await contract.games(gameId);
    console.log('👤 Player:', gameData.player);
    console.log('📊 Status:', gameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');
    console.log('');

    // 4. Simular que el jugador ganó (score >= 50)
    console.log('4️⃣ Simulando victoria del jugador...');
    const setResultTx = await contract.setResult(gameId, true);
    await setResultTx.wait();
    console.log('✅ Resultado establecido: WON');

    // 5. Verificar nuevo estado
    const updatedGameData = await contract.games(gameId);
    console.log('📊 Nuevo Status:', updatedGameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');
    console.log('');

    // 6. Reclamar premio
    console.log('5️⃣ Reclamando premio...');
    const claimTx = await contract.claimWinnings(gameId);
    await claimTx.wait();
    console.log('✅ Premio reclamado');
    console.log('📝 Transaction hash:', claimTx.hash);

    // 7. Verificar estado final
    const finalGameData = await contract.games(gameId);
    console.log('📊 Estado final:', finalGameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');

    // 8. Verificar balance final de USDC
    const finalUsdcBalance = await usdc.balanceOf(wallet.address);
    console.log('💵 Balance final USDC:', ethers.formatUnits(finalUsdcBalance, 6), 'USDC');

    console.log('\n🎉 ¡Pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testContract();
