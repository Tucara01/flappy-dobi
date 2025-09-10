const hre = require("hardhat");

async function main() {
  console.log('🚀 Desplegando contratos...\n');

  // 1. Desplegar MockUSDC
  console.log('1️⃣ Desplegando MockUSDC...');
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log('✅ MockUSDC desplegado en:', usdcAddress);

  // 2. Mintear USDC para el deployer
  console.log('2️⃣ Minteando 1000 USDC...');
  const mintTx = await usdc.mint(await hre.ethers.getSigners()[0].getAddress(), hre.ethers.parseUnits('1000', 6));
  await mintTx.wait();
  console.log('✅ 1000 USDC minteados');

  // 3. Desplegar FlappyDobiVsScore
  console.log('3️⃣ Desplegando FlappyDobiVsScore...');
  const FlappyDobiVsScore = await hre.ethers.getContractFactory("FlappyDobiVsScore");
  const contract = await FlappyDobiVsScore.deploy(usdcAddress);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log('✅ FlappyDobiVsScore desplegado en:', contractAddress);

  console.log('\n📋 Resumen del despliegue:');
  console.log('💵 MockUSDC Address:', usdcAddress);
  console.log('🎮 Contract Address:', contractAddress);
  console.log('👤 Owner:', await hre.ethers.getSigners()[0].getAddress());

  console.log('\n🔧 Variables de entorno para .env:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
  console.log(`RPC_URL=http://127.0.0.1:8545`);

  console.log('\n🎉 ¡Despliegue completado!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
