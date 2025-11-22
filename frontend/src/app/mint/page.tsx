"use client";
import { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { useActiveWallet, useActiveAccount } from "thirdweb/react";
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

// Swap contract ABI
const SWAP_ABI = [
  {
    inputs: [],
    name: "buyRushTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "cusdAmount", type: "uint256" }],
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
  const [isMinted, setIsMinted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalInProgress, setApprovalInProgress] = useState(false);
  const [claimInProgress, setClaimInProgress] = useState(false);
  const [rushBalance, setRushBalance] = useState<string>("0");
  const [celoBalance, setCeloBalance] = useState<string>("0");
  const [buyRushAmount, setBuyRushAmount] = useState<string>("34"); // RUSH amount to buy
  const [buyRushInProgress, setBuyRushInProgress] = useState(false);
  const [nftTokenId, setNftTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [cUSDBalance, setCUSDBalance] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<"CELO" | "cUSD">("CELO");
  
  const count = 1; // Always mint 1 Gem at a time

  const wallet = useActiveWallet();
  const account = useActiveAccount();

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
      setIsConnected(true);
      setIsLoading(false);
      checkRushBalance();
      checkCeloBalance();
      checkGemBalance();
      // Only check cUSD balance for MiniPay users
      if (isMiniPay && account.address) {
        checkCUSDBalance(account.address).then(setCUSDBalance);
      }
    } else {
      setIsConnected(false);
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

  const checkRushBalance = async () => {
    if (!account?.address || !(typeof window !== 'undefined' && (window as any).ethereum)) return;

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      console.log("Checking RUSH balance from token address:", RUSH_TOKEN_ADDRESS);
      const tokenContract = new ethers.Contract(RUSH_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(account.address);
      const balanceFormatted = formatEther(balance);
      const balanceDisplay = formatBalance(balance);
      console.log("RUSH balance (raw):", balance.toString());
      console.log("RUSH balance (formatted):", balanceFormatted);
      console.log("RUSH balance (display):", balanceDisplay);
      // Store both: formatted for calculations, display for UI
      setRushBalance(balanceFormatted);
    } catch (error) {
      console.error("Error checking RUSH balance:", error);
    }
  };

  const checkCeloBalance = async () => {
    if (!account?.address || !(typeof window !== 'undefined' && (window as any).ethereum)) return;

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const balance = await provider.getBalance(account.address);
      setCeloBalance(formatEther(balance));
    } catch (error) {
      console.error("Error checking CELO balance:", error);
    }
  };

  const checkGemBalance = async () => {
    if (!account?.address || !(typeof window !== 'undefined' && (window as any).ethereum)) return;

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const gemContractInstance = new ethers.Contract(GEM_CONTRACT_ADDRESS, GEM_ABI, provider);
      const balance = await gemContractInstance.balanceOf(account.address);
      if (Number(balance) > 0) {
        setIsMinted(true);
      }
    } catch (error) {
      console.error("Error checking Gem balance:", error);
    }
  };

  const handleBuyRush = async () => {
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!SWAP_CONTRACT_ADDRESS) {
      toast.error("Swap contract not deployed yet. Please wait for deployment.");
      return;
    }

    try {
      const rushAmount = parseFloat(buyRushAmount);
      if (isNaN(rushAmount) || rushAmount <= 0) {
        toast.error("Please enter a valid RUSH amount");
        return;
      }

      setBuyRushInProgress(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_ABI, signer);

      if (paymentMethod === "CELO") {
        // Buy with CELO
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
        
        const tx = await swapContract.buyRushTokens({
          value: celoAmountWei,
          gasLimit: 200000
        });

        toast.loading(`Buying ${rushAmount} RUSH tokens with CELO...`, { id: "buy-rush" });
        const receipt = await tx.wait();
        
        toast.success(`Successfully bought ${rushAmount} RUSH tokens! 🎉`, { id: "buy-rush" });
        
        // Refresh balances
        await Promise.all([
          checkRushBalance(),
          checkCeloBalance()
        ]);
      } else {
        // Buy with cUSD (MiniPay only)
        if (!isMiniPay) {
          toast.error("cUSD payments are only available for MiniPay users");
          setBuyRushInProgress(false);
          return;
        }

        // 0.17 cUSD = 30 RUSH, so for rushAmount RUSH: (rushAmount / 30) * 0.17
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

        // Check and approve cUSD spending
        const cusdContract = new ethers.Contract(CUSD_TOKEN_ADDRESS, CUSD_ABI, signer);
        const cusdAmountWei = ethers.utils.parseEther(cusdAmount.toFixed(18));
        const allowance = await cusdContract.allowance(account.address, SWAP_CONTRACT_ADDRESS);
        
        if (allowance.lt(cusdAmountWei)) {
          toast.loading("Approving cUSD spending...", { id: "approve-cusd" });
          const approveTx = await cusdContract.approve(SWAP_CONTRACT_ADDRESS, ethers.constants.MaxUint256);
          await approveTx.wait();
          toast.success("cUSD approved!", { id: "approve-cusd" });
        }

        const tx = await swapContract.buyRushTokensWithCUSD(cusdAmountWei, {
          gasLimit: 200000
        });

        toast.loading(`Buying ${rushAmount} RUSH tokens with cUSD...`, { id: "buy-rush" });
        const receipt = await tx.wait();
        
        toast.success(`Successfully bought ${rushAmount} RUSH tokens! 🎉`, { id: "buy-rush" });
        
        // Refresh balances
        await Promise.all([
          checkRushBalance(),
          checkCUSDBalance(account.address).then(setCUSDBalance)
        ]);
      }
      
      // Also refresh after a short delay to ensure balance is updated on-chain
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
      
      setBuyRushAmount("34"); // Reset to Gem price
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
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();

      const tokenContract = new ethers.Contract(RUSH_TOKEN_ADDRESS, ERC20_ABI, provider);
      const requiredAmount = PRICE_PER_GEM; // Always 1 Gem

      console.log("Minting Gem - Token address:", RUSH_TOKEN_ADDRESS);
      console.log("Required amount:", formatEther(requiredAmount), "RUSH");

      // Check balance
      const balance = await tokenContract.balanceOf(account.address);
      const balanceFormatted = formatEther(balance);
      const requiredFormatted = formatEther(requiredAmount);
      console.log("Current balance:", balanceFormatted, "RUSH");
      console.log("Required balance:", requiredFormatted, "RUSH");
      
      // Check exact balance - no tolerance
      if (balance.lt(requiredAmount)) {
        toast.error(`Insufficient RUSH balance. You have ${parseFloat(balanceFormatted).toFixed(6)} RUSH, but need exactly ${requiredFormatted} RUSH tokens.`);
        return;
      }

      // Check and approve
      const allowance = await tokenContract.allowance(account.address, GEM_CONTRACT_ADDRESS);
      if (allowance.lt(requiredAmount)) {
        setApprovalInProgress(true);
        const tokenWithSigner = tokenContract.connect(signer);
        const approvalTx = await tokenWithSigner.approve(GEM_CONTRACT_ADDRESS, requiredAmount);
        await approvalTx.wait();
        setApprovalInProgress(false);
        toast.success("RUSH tokens approved!");
      }

      // Mint Gem
      setClaimInProgress(true);
      const gemContractInstance = new ethers.Contract(GEM_CONTRACT_ADDRESS, GEM_ABI, provider);
      
      // Verify payment token matches before attempting claim
      const gemPaymentToken = await gemContractInstance.paymentToken();
      console.log("Gem contract payment token:", gemPaymentToken);
      console.log("Expected payment token:", RUSH_TOKEN_ADDRESS);
      
      if (gemPaymentToken.toLowerCase() !== RUSH_TOKEN_ADDRESS.toLowerCase()) {
        throw new Error(`Payment token mismatch! Gem contract expects ${gemPaymentToken} but we're using ${RUSH_TOKEN_ADDRESS}. Please wait for contract update or contact support.`);
      }
      
      // Check if claim is active
      const isClaimActive = await gemContractInstance.claimActive();
      console.log("Claim active:", isClaimActive);
      if (!isClaimActive) {
        throw new Error("Claim is not active. Please contact support.");
      }
      
      const gemWithSigner = gemContractInstance.connect(signer);

      console.log("Calling claim with:");
      console.log("  Receiver:", account.address);
      console.log("  Quantity: 1");
      console.log("  Currency (RUSH Token):", RUSH_TOKEN_ADDRESS);
      console.log("  Price per token:", formatEther(PRICE_PER_GEM), "RUSH");

      const claimTx = await gemWithSigner.claim(
        account.address,
        1, // Always mint 1 Gem
        RUSH_TOKEN_ADDRESS,
        PRICE_PER_GEM,
        [[], "0", "115792089237316195423570985008687907853269984665640564039457584007913129639935", "0x0000000000000000000000000000000000000000"],
        "0x",
        { gasLimit: 500000 } // Increased gas limit
      );

      const receipt = await claimTx.wait();
      
      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error("Transaction reverted. Please check your balance and try again.");
      }
      
      setTxHash(receipt.transactionHash);
      setIsMinted(true);
      setClaimInProgress(false);

      toast.success("Gem minted successfully! 🎉", {
        duration: 3000
      });

      // Refresh balances immediately
      await Promise.all([
        checkRushBalance(),
        checkGemBalance()
      ]);
      
      // Also refresh after a short delay to ensure balance is updated on-chain
      setTimeout(async () => {
        await checkRushBalance();
        await checkGemBalance();
      }, 2000);

    } catch (error: any) {
      console.error("Transaction error:", error);
      setApprovalInProgress(false);
      setClaimInProgress(false);
      
      // Extract more detailed error message
      let errorMessage = "Transaction failed";
      if (error?.message) {
        errorMessage = error.message;
        // Check for common revert reasons
        if (error.message.includes("revert")) {
          if (error.message.includes("Claim is not active")) {
            errorMessage = "Claim is not active. Please contact support.";
          } else if (error.message.includes("Invalid payment token")) {
            errorMessage = "Invalid payment token. The Gem contract may not be updated yet.";
          } else if (error.message.includes("Invalid price")) {
            errorMessage = "Price mismatch. Please refresh and try again.";
          } else if (error.message.includes("Exceeds max supply")) {
            errorMessage = "Maximum supply reached.";
          } else {
            errorMessage = `Transaction reverted: ${error.message}`;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <IPhoneFrame backgroundClassName="bg-rhythmrush">
        <div className="flex flex-col items-center justify-center h-full p-6">
          <p className="text-white text-xl mb-4">Please connect your wallet</p>
          <button
            onClick={() => window.location.href = '/wallet-connect'}
            className="bg-rhythmrush-gold text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            Connect Wallet
          </button>
        </div>
      </IPhoneFrame>
    );
  }

  const statusBarContent = (
    <>
      <div className="status-bar-item">
        <div className={`status-indicator ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <div className="truncate max-w-[150px]">
          {account?.address ? `${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}` : "Not Connected"}
        </div>
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
            <div className="text-center">
              <h1 className="title-section">
                <span className="text-rhythmrush-gold">MINT</span>
                <span className="text-white"> GEM</span>
              </h1>
            </div>

            <div className="card-blur">
              {/* Balances */}
              <div className="space-y-3 mb-6">
                {isMiniPay && (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <span className="text-white font-semibold">cUSD Balance:</span>
                    <span className="text-green-300 font-bold">{parseFloat(cUSDBalance).toFixed(2)} cUSD</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">CELO Balance:</span>
                  <span className="text-white font-bold">{parseFloat(celoBalance).toFixed(4)} CELO</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">RUSH Balance:</span>
                    <button
                      onClick={checkRushBalance}
                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                      title="Refresh balance"
                    >
                      🔄
                    </button>
                  </div>
                  <span className="text-rhythmrush-gold font-bold">
                    {rushBalance ? (() => {
                      // Format directly from string to avoid parseFloat rounding
                      const parts = rushBalance.split('.');
                      if (parts.length === 1) return `${parts[0]}.00`;
                      const decimals = parts[1].substring(0, 2).padEnd(2, '0');
                      return `${parts[0]}.${decimals}`;
                    })() : '0.00'} RUSH
                  </span>
                </div>
              </div>

              {/* Buy RUSH Section - Always show if balance is less than 34 RUSH */}
              {(() => {
                if (!rushBalance) return true; // Show if no balance loaded yet
                // Compare using BigNumber to avoid rounding issues
                try {
                  const balanceBN = ethers.utils.parseEther(rushBalance);
                  const requiredBN = ethers.BigNumber.from(PRICE_PER_GEM);
                  return balanceBN.lt(requiredBN);
                } catch {
                  // Fallback to parseFloat comparison
                  return parseFloat(rushBalance) < 34.0;
                }
              })() && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="space-y-3">
                    {/* Payment Method Selector - Only show cUSD option for MiniPay users */}
                    {isMiniPay ? (
                      <div>
                        <label className="text-white/80 text-sm mb-2 block">Payment Method</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("CELO")}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                              paymentMethod === "CELO"
                                ? "bg-rhythmrush-gold text-black"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            CELO
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cUSD")}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                              paymentMethod === "cUSD"
                                ? "bg-green-500 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            cUSD (MiniPay)
                          </button>
                        </div>
                        {paymentMethod === "cUSD" && (
                          <p className="text-green-300 text-xs mt-2">
                            💚 Using MiniPay for seamless, low-cost transactions
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-300 text-xs text-center">
                          💡 Tip: Use MiniPay for cUSD payments and lower transaction costs
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-white/80 text-sm mb-1 block">Amount (RUSH)</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={buyRushAmount}
                        onChange={(e) => setBuyRushAmount(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rhythmrush-gold"
                        placeholder="34"
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setBuyRushAmount("34")}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition"
                        >
                          34 RUSH
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyRushAmount("50")}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition"
                        >
                          50 RUSH
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyRushAmount("100")}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition"
                        >
                          100 RUSH
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyRushAmount("200")}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition"
                        >
                          200 RUSH
                        </button>
                      </div>
                      <p className="text-white/60 text-xs mt-2">
                        Cost: <span className={`font-semibold ${paymentMethod === "CELO" ? "text-yellow-400" : "text-green-400"}`}>
                          {calculateCost(buyRushAmount)} {getCostLabel()}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleBuyRush}
                      disabled={buyRushInProgress || parseFloat(buyRushAmount) < 1 || checkBalance() < parseFloat(calculateCost(buyRushAmount))}
                      className={`w-full font-bold py-3 px-6 rounded-xl transition ${
                        paymentMethod === "CELO"
                          ? "bg-rhythmrush-gold hover:bg-yellow-400 disabled:bg-gray-500 disabled:cursor-not-allowed text-black"
                          : "bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white"
                      }`}
                    >
                      {buyRushInProgress ? "Buying..." : `BUY ${buyRushAmount} RUSH with ${getCostLabel()}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Gem Price */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Gem Price:</span>
                  <span className="text-rhythmrush-gold font-bold text-xl">34 RUSH</span>
                </div>
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={approvalInProgress || claimInProgress || parseFloat(rushBalance) < parseFloat(totalCost)}
                className="w-full bg-rhythmrush-gold hover:bg-yellow-400 disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition shadow-lg"
              >
                {approvalInProgress ? "Approving..." : claimInProgress ? "Minting..." : isMinted ? "Already Minted" : "MINT GEM"}
              </button>

              {isMinted && (
                <button
                  onClick={() => window.location.href = '/play'}
                  className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-bold py-4 rounded-xl transition"
                >
                  PLAY GAME
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </IPhoneFrame>
    </>
  );
}

