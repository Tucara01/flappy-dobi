import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  UNISWAP_V3_ADDRESSES, 
  QUOTER_ABI, 
  SWAP_ROUTER_ABI, 
  ERC20_ABI,
  FACTORY_ABI,
  WETH_BASE 
} from '../lib/uniswap-config';

// Define una interfaz para los objetos de token para mejorar la seguridad de tipos
interface Token {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
}

export const useDobiSwap = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [quote, setQuote] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función de debugging para verificar tokens
  const debugTokenInfo = useCallback(async (tokenInObj: Token, tokenOutObj: Token) => {
    if (!publicClient) return;
    
    console.log("🔍 Debugging token info:");
    console.log("Token In:", {
      symbol: tokenInObj.symbol,
      address: tokenInObj.address,
      decimals: tokenInObj.decimals
    });
    console.log("Token Out:", {
      symbol: tokenOutObj.symbol,
      address: tokenOutObj.address,
      decimals: tokenOutObj.decimals
    });
    
    // Verificar si los tokens existen
    try {
      const tokenInSymbol = await publicClient.readContract({
        address: tokenInObj.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol'
      });
      console.log("✅ Token In symbol:", tokenInSymbol);
    } catch (error) {
      console.log("❌ Token In no válido:", error);
    }
    
    try {
      const tokenOutSymbol = await publicClient.readContract({
        address: tokenOutObj.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol'
      });
      console.log("✅ Token Out symbol:", tokenOutSymbol);
    } catch (error) {
      console.log("❌ Token Out no válido:", error);
    }
  }, [publicClient]);

  // Función para verificar si existe un pool
  const findPoolAddress = useCallback(async (tokenA: string, tokenB: string) => {
    if (!publicClient) return null;

    // Ordenar tokens alfabéticamente (requerido por Uniswap)
    const token0 = tokenA < tokenB ? tokenA : tokenB;
    const token1 = tokenA < tokenB ? tokenB : tokenA;
    
    const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    
    for (const fee of feeTiers) {
      try {
        const poolAddress = await publicClient.readContract({
          address: UNISWAP_V3_ADDRESSES.FACTORY as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getPool',
          args: [token0 as `0x${string}`, token1 as `0x${string}`, fee]
        }) as `0x${string}`;
        
        // Si el pool existe (no es la dirección cero)
        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Pool encontrado: ${poolAddress} con fee ${fee/10000}%`);
          return { poolAddress, fee, token0, token1 };
        }
      } catch (error) {
        console.log(`❌ Error probando fee ${fee}:`, error);
        continue;
      }
    }
    
    return null;
  }, [publicClient]);

  // Get quote using Uniswap V3 Quoter with retry mechanism
  const getQuote = useCallback(async (
    amountIn: string, 
    tokenInObj: Token, 
    tokenOutObj: Token
  ) => {
    if (!publicClient || !amountIn || amountIn === '0') return null;

    try {
      const amountInWei = parseUnits(amountIn, tokenInObj.decimals);

      // Para la cotización, usamos WETH si el token de entrada es ETH
      const isNativeEth = tokenInObj.symbol === 'ETH';
      const tokenInAddress = isNativeEth ? WETH_BASE.address : tokenInObj.address;
      
      // Debug: verificar información de tokens
      await debugTokenInfo(
        { ...tokenInObj, address: tokenInAddress as `0x${string}` },
        tokenOutObj
      );
      
      // 1. Primero verificar si existe el pool
      const poolInfo = await findPoolAddress(tokenInAddress, tokenOutObj.address);
      
      if (!poolInfo) {
        throw new Error(`No liquidity pool found for ${tokenInObj.symbol}/${tokenOutObj.symbol} with any fee tier`);
      }
      
      // 2. Usar el fee tier correcto para la cotización
      const params = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutObj.address,
        fee: poolInfo.fee,
        amountIn: amountInWei,
        sqrtPriceLimitX96: 0n
      };
      
      console.log("📊 Quote parameters:", {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        amountIn: params.amountIn.toString(),
        sqrtPriceLimitX96: params.sqrtPriceLimitX96.toString()
      });
      
      // 3. Implementar retry mechanism
      const maxRetries = 3;
      let result = null;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await publicClient.readContract({
            address: UNISWAP_V3_ADDRESSES.QUOTER_V2 as `0x${string}`,
            abi: QUOTER_ABI,
            functionName: 'quoteExactInputSingle',
            args: [params]
          });
          break; // Si funciona, salir del loop
        } catch (error) {
          console.log(`Intento ${i + 1} falló:`, error);
          if (i === maxRetries - 1) throw error;
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      
      if (!result) {
        throw new Error(`Failed to get quote after ${maxRetries} attempts`);
      }
      
      // Extract the amountOut from the result tuple
      const quotedAmountOut = result[0] as bigint;
      
      const formattedAmount = formatUnits(
        quotedAmountOut, 
        tokenOutObj.decimals
      );
      
      setQuote(formattedAmount);
      return formattedAmount;
    } catch (error) {
      console.error("Error getting quote:", error);
      return null;
    }
  }, [publicClient, findPoolAddress]);

  // Token approval function
  const approveToken = useCallback(async (
    tokenAddress: string, 
    amount: bigint,
  ) => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet not connected');

    // Check current allowance
    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, UNISWAP_V3_ADDRESSES.SWAP_ROUTER]
    }) as bigint;
    
    if (allowance < amount) {
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V3_ADDRESSES.SWAP_ROUTER, amount]
      });
      await publicClient.waitForTransactionReceipt({ hash });
    }
  }, [walletClient, address, publicClient]);

  // Execute swap
  const executeSwap = useCallback(async (
    amountIn: string, 
    tokenInObj: Token, 
    tokenOutObj: Token, 
    slippage: number = 0.5,
  ) => {
    if (!walletClient || !address || !publicClient || !amountIn) throw new Error('Wallet not connected');

    try {
      setIsLoading(true);

      const amountInWei = parseUnits(amountIn, tokenInObj.decimals);
      
      // Determinar si el token de entrada es ETH nativo
      const isNativeEth = tokenInObj.symbol === 'ETH';

      // Get current quote
      const quotedAmount = await getQuote(amountIn, isNativeEth ? { ...tokenInObj, address: WETH_BASE.address } : tokenInObj, tokenOutObj);
      if (!quotedAmount) throw new Error("Could not get quote");

      // Calculate minimum amount out with slippage
      const minAmountOut = parseUnits(
        (parseFloat(quotedAmount) * (1 - slippage/100)).toFixed(tokenOutObj.decimals),
        tokenOutObj.decimals
      );

      // Approve tokens if not ETH
      if (!isNativeEth) {
        await approveToken(tokenInObj.address, amountInWei);
      }

      // Find the correct fee tier for the swap using the same method as getQuote
      const tokenInAddress = isNativeEth ? WETH_BASE.address : tokenInObj.address;
      const poolInfo = await findPoolAddress(tokenInAddress, tokenOutObj.address);
      
      if (!poolInfo) {
        throw new Error(`No liquidity pool found for ${tokenInObj.symbol}/${tokenOutObj.symbol} with any fee tier`);
      }
      
      const swapParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutObj.address,
        fee: poolInfo.fee,
        recipient: address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes
        amountIn: amountInWei,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: 0n
      };

      const hash = await walletClient.writeContract({
        address: UNISWAP_V3_ADDRESSES.SWAP_ROUTER as `0x${string}`,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [swapParams],
        value: isNativeEth ? amountInWei : 0n, // Enviar ETH nativo en el campo 'value'
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return { hash, receipt };

    } catch (error) {
      console.error("Error executing swap:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, getQuote, approveToken, findPoolAddress]);

  return { 
    getQuote, 
    executeSwap, 
    quote, 
    priceImpact, 
    isLoading, 
    setIsLoading 
  };
};