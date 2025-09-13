import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  UNISWAP_V3_ADDRESSES, 
  QUOTER_ABI, 
  SWAP_ROUTER_ABI, 
  ERC20_ABI,
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

  // Get quote using Uniswap V3 Quoter
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
      
      // Probar diferentes fee tiers para encontrar el pool correcto
      const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
      let result = null;
      
      for (const fee of feeTiers) {
        try {
          const params = {
            tokenIn: isNativeEth ? WETH_BASE.address : tokenInObj.address,
            tokenOut: tokenOutObj.address,
            fee: fee,
            amountIn: amountInWei,
            sqrtPriceLimitX96: 0n
          };
          
          result = await publicClient.readContract({
            address: UNISWAP_V3_ADDRESSES.QUOTER_V2 as `0x${string}`,
            abi: QUOTER_ABI,
            functionName: 'quoteExactInputSingle',
            args: [params]
          });
          
          // Si llegamos aquí, el pool existe con este fee tier
          break;
        } catch (error) {
          console.log(`Pool not found with fee tier ${fee}, trying next...`);
          continue;
        }
      }
      
      if (!result) {
        throw new Error(`No liquidity pool found for ${tokenInObj.symbol}/${tokenOutObj.symbol} with any fee tier`);
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
  }, [publicClient]);

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

      // Find the correct fee tier for the swap
      const feeTiers = [500, 3000, 10000];
      let swapParams = null;
      
      for (const fee of feeTiers) {
        try {
          // Test if this fee tier works for the quote
          const testParams = {
            tokenIn: isNativeEth ? WETH_BASE.address : tokenInObj.address,
            tokenOut: tokenOutObj.address,
            fee: fee,
            amountIn: amountInWei,
            sqrtPriceLimitX96: 0n
          };
          
          await publicClient.readContract({
            address: UNISWAP_V3_ADDRESSES.QUOTER_V2 as `0x${string}`,
            abi: QUOTER_ABI,
            functionName: 'quoteExactInputSingle',
            args: [testParams]
          });
          
          // If we get here, this fee tier works
          swapParams = {
            tokenIn: isNativeEth ? WETH_BASE.address : tokenInObj.address,
            tokenOut: tokenOutObj.address,
            fee: fee,
            recipient: address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes
            amountIn: amountInWei,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n
          };
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!swapParams) {
        throw new Error(`No liquidity pool found for ${tokenInObj.symbol}/${tokenOutObj.symbol} with any fee tier`);
      }

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
  }, [walletClient, address, getQuote, approveToken]);

  return { 
    getQuote, 
    executeSwap, 
    quote, 
    priceImpact, 
    isLoading, 
    setIsLoading 
  };
};