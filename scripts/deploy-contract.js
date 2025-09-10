const { ethers } = require('ethers');

// Configuración para red local (Hardhat/Anvil)
const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0

// Código del contrato compilado (debes compilarlo primero con Hardhat)
const CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b506040516...'; // Reemplazar con el bytecode real

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
  }
];

// ABI del token USDC simulado
const USDC_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "decimals",
        "type": "uint8"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function deployContracts() {
  try {
    console.log('🚀 Desplegando contratos en red local...\n');

    // Conectar a la red local
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📡 Conectado a red local');
    console.log('👤 Wallet:', wallet.address);
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH\n');

    // 1. Desplegar token USDC simulado
    console.log('1️⃣ Desplegando token USDC simulado...');
    const USDC_FACTORY = new ethers.ContractFactory(USDC_ABI, CONTRACT_BYTECODE, wallet);
    const usdc = await USDC_FACTORY.deploy('USD Coin', 'USDC', 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log('✅ USDC desplegado en:', usdcAddress);

    // 2. Mintear USDC para el wallet
    console.log('2️⃣ Minteando 1000 USDC...');
    const mintTx = await usdc.mint(wallet.address, ethers.parseUnits('1000', 6));
    await mintTx.wait();
    console.log('✅ 1000 USDC minteados');

    // 3. Desplegar contrato FlappyDobiVsScore
    console.log('3️⃣ Desplegando contrato FlappyDobiVsScore...');
    const CONTRACT_FACTORY = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
    const contract = await CONTRACT_FACTORY.deploy(usdcAddress);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log('✅ Contrato desplegado en:', contractAddress);

    console.log('\n📋 Resumen del despliegue:');
    console.log('💵 USDC Address:', usdcAddress);
    console.log('🎮 Contract Address:', contractAddress);
    console.log('👤 Owner:', wallet.address);

    console.log('\n🔧 Variables de entorno para .env:');
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`PRIVATE_KEY=${PRIVATE_KEY}`);
    console.log(`RPC_URL=${RPC_URL}`);

    console.log('\n🎉 ¡Despliegue completado!');

  } catch (error) {
    console.error('❌ Error en el despliegue:', error);
  }
}

// Ejecutar el despliegue
deployContracts();
