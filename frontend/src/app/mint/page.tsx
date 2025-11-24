"use client";
import { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { useWallet } from "@/context/WalletContext";
import { client } from "@/client";
import { defineChain, getContract } from "thirdweb";
import { getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { ethers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";
import Loading from "@/components/Loading";
import SuccessBanner from "@/components/SuccessBanner";
import { MintingLoader } from "@/components/mint/MintingLoader";
import { isMiniPayAvailable, checkCUSDBalance, openMiniPayAddCash } from "@/utils/minipay";
import { AddressDisplay } from "@/components/molecules/AddressDisplay";
import { prepareContractCall, sendTransaction, waitForReceipt, readContract } from "thirdweb";
import { useActiveWalletChain } from "thirdweb/react";

// Contract addresses on Celo Sepolia
const RUSH_TOKEN_ADDRESS = "0x9A8629e7D3FcCDbC4d1DE24d43013452cfF23cF0"; // New token with swap functionality and cUSD support
const GEM_CONTRACT_ADDRESS = "0xBdE05919CE1ee2E20502327fF74101A8047c37be";
const SWAP_CONTRACT_ADDRESS = "0x2744e8aAce17a217858FF8394C9d1198279215d9"; // Deployed on Celo Sepolia with cUSD support
const PRICE_PER_GEM = BigInt("34000000000000000000"); // 34 RUSH tokens
const EXCHANGE_RATE = 30; // 1 CELO = 30 RUSH tokens
const CUSD_EXCHANGE_RATE = 0.17 / 30; // 0.17 cUSD = 30 RUSH, so 1 RUSH = 0.17/30 cUSD
const CUSD_TOKEN_ADDRESS = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"; // Celo Sepolia cUSD

// ERC20 ABI for RUSH token
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  }
];

// ERC721 ABI for Gem contract
const GEM_ABI = [
  {
    inputs: [
      { name: "_receiver", type: "address" },
      { name: "_quantity", type: "uint256" },
      { name: "_currency", type: "address" },
      { name: "_pricePerToken", type: "uint256" },
      {
        components: [
          { name: "proof", type: "bytes32[]" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" }
        ],
        name: "_allowlistProof",
        type: "tuple"
      },
      { name: "_data", type: "bytes" }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "paymentToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "claimActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
];

// Swap Contract ABI
const SWAP_ABI = [
  {
    inputs: [],
    name: "buyRushTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "buyRushTokensWithCUSD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "celoAmount", type: "uint256" }],
    name: "calculateRushAmount",
    outputs: [{ name: "rushAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "cusdAmount", type: "uint256" }],
    name: "calculateRushAmountFromCUSD",
    outputs: [{ name: "rushAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getExchangeRate",
    outputs: [{ name: "rate", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCUSDExchangeRate",
    outputs: [{ name: "rate", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// cUSD ERC20 ABI
const CUSD_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  }
];

export default function MintPage() {
  const { isConnected, account, wallet } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [isMinted, setIsMinted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalInProgress, setApprovalInProgress] = useState(false);
  const [claimInProgress, setClaimInProgress] = useState(false);
  const [rushBalance, setRushBalance] = useState<string>("0");
  const [celoBalance, setCeloBalance] = useState<string>("0");
  const [buyRushAmount, setBuyRushAmount] = useState<string>("35"); // RUSH amount to buy
  const [buyRushInProgress, setBuyRushInProgress] = useState(false);
  const [nftTokenId, setNftTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [cUSDBalance, setCUSDBalance] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<"CELO" | "cUSD">("CELO");
  
  const count = 1; // Always mint 1 Gem at a time



  // Celo Sepolia Testnet
  const chain = defineChain({
    id: 11142220,
    name: "Celo Sepolia",
    rpc: "https://forno.celo-sepolia.celo-testnet.org/",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18
    }
  });

  const gemContract = getContract({
    client: client,
    chain: chain,
    address: GEM_CONTRACT_ADDRESS
  });

  useEffect(() => {
    setIsMiniPay(isMiniPayAvailable());
  }, []);

  useEffect(() => {
    if (wallet && account) {
      setIsLoading(false);
      checkRushBalance();
      checkCeloBalance();
      checkGemBalance();
      // Only check cUSD balance for MiniPay users
      if (isMiniPay && account.address) {
        checkCUSDBalance(account.address).then(setCUSDBalance);
      }
    } else {
      setIsLoading(false);
    }
  }, [wallet, account, isMiniPay]);

  // Set default payment method based on MiniPay availability
  useEffect(() => {
    if (isMiniPay) {
      setPaymentMethod("cUSD"); // Default to cUSD for MiniPay users
    } else {
      setPaymentMethod("CELO"); // Default to CELO for other wallets
    }
  }, [isMiniPay]);

  const formatBalance = (balanceWei: ethers.BigNumber): string => {
    // Convert wei to ether string with full precision
    const balanceStr = balanceWei.toString();
    const decimals = 18;
    
    if (balanceStr === "0") return "0.00";
    
    // Pad with zeros if needed
    const padded = balanceStr.padStart(decimals + 1, "0");
    const integerPart = padded.slice(0, -decimals) || "0";
    const decimalPart = padded.slice(-decimals);
    
    // Remove trailing zeros from decimal part
    const trimmedDecimal = decimalPart.replace(/0+$/, "");
    
    if (trimmedDecimal === "") {
      return `${integerPart}.00`;
    }
    
    // Take first 2 decimal places
    const twoDecimals = trimmedDecimal.substring(0, 2).padEnd(2, "0");
    return `${integerPart}.${twoDecimals}`;
  };

  const activeChain = useActiveWalletChain();

  const checkRushBalance = async () => {
    if (!account?.address) return;

    try {
      console.log("Checking RUSH balance from token address:", RUSH_TOKEN_ADDRESS);
      const tokenContract = getContract({
        client,
        chain,
        address: RUSH_TOKEN_ADDRESS,
      });

      const balance = await readContract({
        contract: tokenContract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [account.address],
      });

      const balanceFormatted = formatEther(balance);
      console.log("RUSH balance (formatted):", balanceFormatted);
      setRushBalance(balanceFormatted);
    } catch (error) {
      console.error("Error checking RUSH balance:", error);
    }
  };

  const checkCeloBalance = async () => {
    if (!account?.address) return;
    // For native balance, we can still use a simple provider or thirdweb's utility if available, 
    // but for now let's stick to a public RPC provider to avoid window.ethereum dependency for reading.
    // Or better, use Thirdweb's useWalletBalance hook if we were using it, but here we are in a function.
    // Let's use a public provider for reading.
    try {
      const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
      const balance = await provider.getBalance(account.address);
      setCeloBalance(formatEther(balance));
    } catch (error) {
      console.error("Error checking CELO balance:", error);
    }
  };

  const checkGemBalance = async () => {
    if (!account?.address) return;

    try {
      const balance = await readContract({
        contract: gemContract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [account.address],
      });
      
      if (Number(balance) > 0) {
        setIsMinted(true);
      }
    } catch (error) {
      console.error("Error checking Gem balance:", error);
    }
  };

  const handleBuyRush = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!SWAP_CONTRACT_ADDRESS) {
      toast.error("Swap contract not deployed yet.");
      return;
    }

    try {
      const rushAmount = parseFloat(buyRushAmount);
      if (isNaN(rushAmount) || rushAmount <= 0) {
        toast.error("Please enter a valid RUSH amount");
        return;
      }

      setBuyRushInProgress(true);

      const swapContract = getContract({
        client,
        chain,
        address: SWAP_CONTRACT_ADDRESS,
      });

      if (paymentMethod === "CELO") {
        const celoAmount = rushAmount / EXCHANGE_RATE;
        const minCelo = 0.01;
        
        if (celoAmount < minCelo) {
          toast.error(`Minimum purchase is ${calculateCeloCost((minCelo * EXCHANGE_RATE).toString())} RUSH (${minCelo} CELO)`);
          setBuyRushInProgress(false);
          return;
        }

        if (parseFloat(celoBalance) < celoAmount) {
          toast.error(`Insufficient CELO balance. You need ${celoAmount.toFixed(4)} CELO`);
          setBuyRushInProgress(false);
          return;
        }

        const celoAmountWei = ethers.utils.parseEther(celoAmount.toFixed(18));
        
        const transaction = prepareContractCall({
          contract: swapContract,
          method: "function buyRushTokens() payable",
          params: [],
          value: BigInt(celoAmountWei.toString()),
        });

        toast.loading(`Buying ${rushAmount} RUSH tokens with CELO...`, { id: "buy-rush" });
        
        const { transactionHash } = await sendTransaction({
          account,
          transaction,
        });

        await waitForReceipt({
          client,
          chain,
          transactionHash,
        });
        
        toast.success(`Successfully bought ${rushAmount} RUSH tokens! 🎉`, { id: "buy-rush" });
        
        await Promise.all([checkRushBalance(), checkCeloBalance()]);
      } else {
        // Buy with cUSD (MiniPay only)
        if (!isMiniPay) {
          toast.error("cUSD payments are only available for MiniPay users");
          setBuyRushInProgress(false);
          return;
        }

        const cusdAmount = (rushAmount / 30) * 0.17;
        const minCUSD = 0.01;
        
        if (cusdAmount < minCUSD) {
          toast.error(`Minimum purchase is ${(minCUSD * 30 / 0.17).toFixed(2)} RUSH (${minCUSD} cUSD)`);
          setBuyRushInProgress(false);
          return;
        }

        if (parseFloat(cUSDBalance) < cusdAmount) {
          toast.error(`Insufficient cUSD balance. You need ${cusdAmount.toFixed(4)} cUSD`);
          setBuyRushInProgress(false);
          return;
        }

        const cusdContract = getContract({
          client,
          chain,
          address: CUSD_TOKEN_ADDRESS,
        });

        const cusdAmountWei = ethers.utils.parseEther(cusdAmount.toFixed(18));
        
        // Check allowance
        const allowance = await readContract({
          contract: cusdContract,
          method: "function allowance(address, address) view returns (uint256)",
          params: [account.address, SWAP_CONTRACT_ADDRESS],
        });
        
        if (BigInt(allowance.toString()) < BigInt(cusdAmountWei.toString())) {
          toast.loading("Approving cUSD spending...", { id: "approve-cusd" });
          
          const approveTx = prepareContractCall({
            contract: cusdContract,
            method: "function approve(address, uint256)",
            params: [SWAP_CONTRACT_ADDRESS, BigInt(ethers.constants.MaxUint256.toString())],
          });

          const { transactionHash } = await sendTransaction({
            account,
            transaction: approveTx,
          });

          await waitForReceipt({
            client,
            chain,
            transactionHash,
          });
          
          toast.success("cUSD approved!", { id: "approve-cusd" });
        }

        const buyTx = prepareContractCall({
          contract: swapContract,
          method: "function buyRushTokensWithCUSD(uint256)",
          params: [BigInt(cusdAmountWei.toString())],
        });

        toast.loading(`Buying ${rushAmount} RUSH tokens with cUSD...`, { id: "buy-rush" });
        
        const { transactionHash } = await sendTransaction({
          account,
          transaction: buyTx,
        });

        await waitForReceipt({
          client,
          chain,
          transactionHash,
        });
        
        toast.success(`Successfully bought ${rushAmount} RUSH tokens! 🎉`, { id: "buy-rush" });
        
        await Promise.all([
          checkRushBalance(),
          checkCUSDBalance(account.address).then(setCUSDBalance)
        ]);
      }
      
      setTimeout(async () => {
        await checkRushBalance();
        if (paymentMethod === "CELO") {
          await checkCeloBalance();
        } else {
          if (account.address) {
            await checkCUSDBalance(account.address).then(setCUSDBalance);
          }
        }
      }, 2000);
      
      setBuyRushAmount("34");
    } catch (error: any) {
      console.error("Error buying RUSH tokens:", error);
      toast.error(error?.message || "Failed to buy RUSH tokens", { id: "buy-rush" });
    } finally {
      setBuyRushInProgress(false);
    }
  };

  const calculateCeloCost = (rushAmount: string): string => {
    const amount = parseFloat(rushAmount);
    if (isNaN(amount) || amount <= 0) return "0";
    return (amount / EXCHANGE_RATE).toFixed(4);
  };

  const calculateCUSDCost = (rushAmount: string): string => {
    const amount = parseFloat(rushAmount);
    if (isNaN(amount) || amount <= 0) return "0";
    // 0.17 cUSD = 30 RUSH, so for amount RUSH: (amount / 30) * 0.17
    return ((amount / 30) * 0.17).toFixed(4);
  };

  const calculateCost = (rushAmount: string): string => {
    if (paymentMethod === "CELO") {
      return calculateCeloCost(rushAmount);
    } else {
      return calculateCUSDCost(rushAmount);
    }
  };

  const getCostLabel = (): string => {
    return paymentMethod === "CELO" ? "CELO" : "cUSD";
  };

  const checkBalance = (): number => {
    return paymentMethod === "CELO" ? parseFloat(celoBalance) : parseFloat(cUSDBalance);
  };

  const handleMint = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const requiredAmount = PRICE_PER_GEM;
      console.log("Minting Gem - Token address:", RUSH_TOKEN_ADDRESS);

      const tokenContract = getContract({
        client,
        chain,
        address: RUSH_TOKEN_ADDRESS,
      });

      // Check balance
      const balance = await readContract({
        contract: tokenContract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [account.address],
      });

      if (BigInt(balance.toString()) < requiredAmount) {
        toast.error(`Insufficient RUSH balance.`);
        return;
      }

      // Check allowance
      const allowance = await readContract({
        contract: tokenContract,
        method: "function allowance(address, address) view returns (uint256)",
        params: [account.address, GEM_CONTRACT_ADDRESS],
      });

      if (BigInt(allowance.toString()) < requiredAmount) {
        setApprovalInProgress(true);
        
        const approveTx = prepareContractCall({
          contract: tokenContract,
          method: "function approve(address, uint256)",
          params: [GEM_CONTRACT_ADDRESS, requiredAmount],
        });

        const { transactionHash } = await sendTransaction({
          account,
          transaction: approveTx,
        });

        await waitForReceipt({
          client,
          chain,
          transactionHash,
        });

        setApprovalInProgress(false);
        toast.success("RUSH tokens approved!");
      }

      // Mint Gem
      setClaimInProgress(true);
      
      // Check if claim is active
      const isClaimActive = await readContract({
        contract: gemContract,
        method: "function claimActive() view returns (bool)",
        params: [],
      });

      if (!isClaimActive) {
        throw new Error("Claim is not active.");
      }
      
      const claimTx = prepareContractCall({
        contract: gemContract,
        method: "function claim(address, uint256, address, uint256, (bytes32[], uint256, uint256, address), bytes) payable",
        params: [
          account.address,
          BigInt(1),
          RUSH_TOKEN_ADDRESS,
          PRICE_PER_GEM,
          [
            [], // proof
            BigInt(0), // quantityLimitPerWallet
            BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"), // pricePerToken (Max uint256)
            "0x0000000000000000000000000000000000000000" // currency
          ],
          "0x"
        ],
      });

      const { transactionHash } = await sendTransaction({
        account,
        transaction: claimTx,
      });

      const receipt = await waitForReceipt({
        client,
        chain,
        transactionHash,
      });
      
      setTxHash(transactionHash);
      setIsMinted(true);
      setClaimInProgress(false);

      toast.success("Gem minted successfully! 🎉", { duration: 3000 });

      await Promise.all([checkRushBalance(), checkGemBalance()]);
      
      setTimeout(async () => {
        await checkRushBalance();
        await checkGemBalance();
      }, 2000);

    } catch (error: any) {
      console.error("Transaction error:", error);
      setApprovalInProgress(false);
      setClaimInProgress(false);
      toast.error(error?.message || "Transaction failed");
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <IPhoneFrame backgroundClassName="bg-rhythmrush">
        <div className="flex flex-col items-center justify-center h-full p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 p-6 bg-white/10 rounded-full backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(255,215,0,0.3)]"
          >
            <span className="text-6xl">💎</span>
          </motion.div>
          
          <h1 className="text-4xl font-black mb-2 text-center">
            <span className="text-rhythmrush-gold">MINT</span>
            <span className="text-white"> GEM</span>
          </h1>
          
          <p className="text-white/60 text-center mb-8 text-lg">
            Connect your wallet to mint Gems and start playing
          </p>

          <button
            onClick={() => window.location.href = '/wallet-connect'}
            className="w-full bg-rhythmrush-gold text-black px-6 py-4 rounded-xl font-bold text-xl hover:bg-yellow-400 transition shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] flex items-center justify-center gap-2"
          >
            <span>Connect Wallet</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V15" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </IPhoneFrame>
    );
  }

  const statusBarContent = (
    <>
      <div className="status-bar-item">
        <AddressDisplay 
          address={account?.address} 
          isConnected={isConnected} 
        />
      </div>
      <div className="status-bar-item">9:41</div>
    </>
  );

  const totalCost = formatEther(PRICE_PER_GEM); // Always 34 RUSH for 1 Gem

  return (
    <>
      {(approvalInProgress || claimInProgress) && (
        <MintingLoader isApproving={approvalInProgress} />
      )}

      {isMinted && txHash && (
        <SuccessBanner txHash={txHash} nftTokenId={nftTokenId || undefined} />
      )}

      <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="content-container"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">
                <span className="text-rhythmrush-gold">MINT</span>
                <span className="text-white"> GEM</span>
              </h1>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              {/* Consolidated Balances */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1">CELO Balance</span>
                  <span className="text-white font-mono font-bold">{parseFloat(celoBalance).toFixed(4)}</span>
                </div>
                <div 
                  className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={checkRushBalance}
                >
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                    RUSH Balance <span className="text-[8px]">↻</span>
                  </span>
                  <span className="text-rhythmrush-gold font-mono font-bold">
                    {rushBalance ? parseFloat(rushBalance).toFixed(2) : '0.00'}
                  </span>
                </div>
                {isMiniPay && (
                  <div className="col-span-2 bg-green-500/10 rounded-xl p-2 flex items-center justify-center border border-green-500/20">
                    <span className="text-green-400 text-xs font-mono font-bold">
                      {parseFloat(cUSDBalance).toFixed(2)} cUSD
                    </span>
                  </div>
                )}
              </div>

              {/* Buy RUSH Section - Only if needed */}
              {(() => {
                const balanceBN = rushBalance ? ethers.utils.parseEther(rushBalance) : ethers.BigNumber.from(0);
                const requiredBN = ethers.BigNumber.from(PRICE_PER_GEM);
                return balanceBN.lt(requiredBN);
              })() && (
                <div className="mb-6">
                  {/* Payment Method Toggle */}
                  {isMiniPay && (
                    <div className="flex bg-black/20 p-1 rounded-xl mb-4">
                      <button
                        onClick={() => setPaymentMethod("CELO")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          paymentMethod === "CELO" 
                            ? "bg-rhythmrush-gold text-black shadow-lg" 
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        CELO
                      </button>
                      <button
                        onClick={() => setPaymentMethod("cUSD")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          paymentMethod === "cUSD" 
                            ? "bg-green-500 text-white shadow-lg" 
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        cUSD
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="number"
                      value={buyRushAmount}
                      onChange={(e) => setBuyRushAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl text-white font-bold text-center focus:outline-none focus:border-rhythmrush-gold/50 transition-colors"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">RUSH</span>
                  </div>

                  <div className="flex justify-center gap-2 mt-3">
                    {["34", "50", "100"].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBuyRushAmount(amount)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-white/70 transition-colors"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>

                  <div className="text-center mt-3 mb-4">
                    <span className="text-xs text-white/40">
                      Cost: <span className="text-white/80 font-mono">{calculateCost(buyRushAmount)} {paymentMethod}</span>
                    </span>
                  </div>

                  <button
                    onClick={handleBuyRush}
                    disabled={buyRushInProgress}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyRushInProgress ? "Processing..." : `Buy ${buyRushAmount} RUSH`}
                  </button>
                </div>
              )}

              {/* Mint Button */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/60 text-sm">Price</span>
                  <span className="text-rhythmrush-gold font-bold text-lg">35 RUSH</span>
                </div>
                
                {isMinted ? (
                  <div className="space-y-4">
                    <div className="w-full bg-white/5 text-white/40 text-xs font-bold py-2 rounded-lg text-center border border-white/5 uppercase tracking-widest">
                      Gem Minted Successfully
                    </div>
                    <motion.button
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "easeInOut"
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.href = '/game'}
                      className="w-full bg-[#FACC15] cursor-pointer text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:bg-[#EAB308] transition-all text-xl flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-black">
                          <path d="M5 3L19 12L5 21V3Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        PLAY GAME
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </motion.button>
                  </div>
                ) : (
                  <button
                    onClick={handleMint}
                    disabled={approvalInProgress || claimInProgress}
                        className="w-full bg-[#FACC15] cursor-pointer text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:bg-[#EAB308] transition-all text-xl flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    MINT GEM
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </IPhoneFrame>
    </>
  );
}

