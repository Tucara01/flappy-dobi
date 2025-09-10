const hre = require("hardhat");

async function main() {
  console.log('🧪 Iniciando pruebas del contrato...\n');

  // Obtener las direcciones de los contratos desplegados
  const contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const usdcAddress = process.env.USDC_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  // Obtener el signer
  const [owner, player] = await hre.ethers.getSigners();
  
  console.log('👤 Owner:', owner.address);
  console.log('👤 Player:', player.address);
  console.log('🎮 Contract:', contractAddress);
  console.log('💵 USDC:', usdcAddress);

  // Crear instancias de los contratos
  const contract = await hre.ethers.getContractAt("FlappyDobiVsScore", contractAddress);
  const usdc = await hre.ethers.getContractAt("MockUSDC", usdcAddress);

  // Verificar balance de USDC del jugador
  const usdcBalance = await usdc.balanceOf(player.address);
  console.log('💵 Balance USDC del jugador:', hre.ethers.formatUnits(usdcBalance, 6), 'USDC\n');

  // 1. Aprobar USDC para el contrato
  console.log('1️⃣ Aprobando 1 USDC para el contrato...');
  const approveTx = await usdc.connect(player).approve(contractAddress, hre.ethers.parseUnits('1', 6));
  await approveTx.wait();
  console.log('✅ USDC aprobado\n');

  // 2. Crear juego
  console.log('2️⃣ Creando juego...');
  const createGameTx = await contract.connect(player).createGame();
  const receipt = await createGameTx.wait();
  console.log('✅ Juego creado');
  console.log('📝 Transaction hash:', createGameTx.hash);

  // Obtener el gameId del evento
  const gameCreatedEvent = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === 'GameCreated';
    } catch (e) {
      return false;
    }
  });

  const gameId = gameCreatedEvent ? contract.interface.parseLog(gameCreatedEvent).args.gameId.toString() : '1';
  console.log('🎮 Game ID:', gameId);
  console.log('');

  // 3. Verificar estado del juego
  console.log('3️⃣ Verificando estado del juego...');
  const gameData = await contract.games(gameId);
  console.log('👤 Player:', gameData.player);
  console.log('📊 Status:', gameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');
  console.log('');

  // 4. Simular que el jugador ganó (score >= 50)
  console.log('4️⃣ Simulando victoria del jugador...');
  const setResultTx = await contract.connect(owner).setResult(gameId, true);
  await setResultTx.wait();
  console.log('✅ Resultado establecido: WON');

  // 5. Verificar nuevo estado
  const updatedGameData = await contract.games(gameId);
  console.log('📊 Nuevo Status:', updatedGameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');
  console.log('');

  // 6. Reclamar premio
  console.log('5️⃣ Reclamando premio...');
  const claimTx = await contract.connect(player).claimWinnings(gameId);
  await claimTx.wait();
  console.log('✅ Premio reclamado');
  console.log('📝 Transaction hash:', claimTx.hash);

  // 7. Verificar estado final
  const finalGameData = await contract.games(gameId);
  console.log('📊 Estado final:', finalGameData.status.toString(), '(0=Pending, 1=Won, 2=Lost, 3=Claimed)');

  // 8. Verificar balance final de USDC
  const finalUsdcBalance = await usdc.balanceOf(player.address);
  console.log('💵 Balance final USDC:', hre.ethers.formatUnits(finalUsdcBalance, 6), 'USDC');

  console.log('\n🎉 ¡Pruebas completadas exitosamente!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  });
