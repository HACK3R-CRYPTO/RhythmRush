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

// Contract addresses on Celo Sepolia
const RUSH_TOKEN_ADDRESS = "0x4F47D6843095F3b53C67B02C9B72eB1d579051ba";
const GEM_CONTRACT_ADDRESS = "0xBdE05919CE1ee2E20502327fF74101A8047c37be";
const PRICE_PER_GEM = BigInt("34000000000000000000"); // 34 RUSH tokens

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
  }
];

export default function MintPage() {
  const [count, setCount] = useState(1);
  const [isMinted, setIsMinted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalInProgress, setApprovalInProgress] = useState(false);
  const [claimInProgress, setClaimInProgress] = useState(false);
  const [rushBalance, setRushBalance] = useState<string>("0");
  const [nftTokenId, setNftTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

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
    if (wallet && account) {
      setIsConnected(true);
      setIsLoading(false);
      checkRushBalance();
      checkGemBalance();
    } else {
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [wallet, account]);

  const checkRushBalance = async () => {
    if (!account?.address || !window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(RUSH_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(account.address);
      setRushBalance(formatEther(balance));
    } catch (error) {
      console.error("Error checking RUSH balance:", error);
    }
  };

  const checkGemBalance = async () => {
    if (!account?.address || !window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const gemContractInstance = new ethers.Contract(GEM_CONTRACT_ADDRESS, GEM_ABI, provider);
      const balance = await gemContractInstance.balanceOf(account.address);
      if (Number(balance) > 0) {
        setIsMinted(true);
      }
    } catch (error) {
      console.error("Error checking Gem balance:", error);
    }
  };

  const handleMint = async () => {
    if (!account || !window.ethereum) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tokenContract = new ethers.Contract(RUSH_TOKEN_ADDRESS, ERC20_ABI, provider);
      const requiredAmount = PRICE_PER_GEM * BigInt(count);

      // Check balance
      const balance = await tokenContract.balanceOf(account.address);
      if (balance.lt(requiredAmount)) {
        toast.error(`Insufficient RUSH balance. You need ${formatEther(requiredAmount)} RUSH tokens.`);
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
      const gemWithSigner = gemContractInstance.connect(signer);

      const claimTx = await gemWithSigner.claim(
        account.address,
        count,
        RUSH_TOKEN_ADDRESS,
        PRICE_PER_GEM,
        [[], "0", "115792089237316195423570985008687907853269984665640564039457584007913129639935", "0x0000000000000000000000000000000000000000"],
        "0x",
        { gasLimit: 300000 }
      );

      const receipt = await claimTx.wait();
      setTxHash(receipt.transactionHash);
      setIsMinted(true);
      setClaimInProgress(false);

      toast.success("Gem minted successfully! 🎉", {
        duration: 3000
      });

      // Refresh balances
      checkRushBalance();
      checkGemBalance();

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
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <div className="text-white text-xs truncate max-w-[150px]">
          {account?.address ? `${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}` : "Not Connected"}
        </div>
      </div>
      <div className="text-white text-xs">9:41</div>
    </>
  );

  const totalCost = formatEther(PRICE_PER_GEM * BigInt(count));

  return (
    <>
      {(approvalInProgress || claimInProgress) && (
        <MintingLoader isApproving={approvalInProgress} />
      )}

      {isMinted && txHash && (
        <SuccessBanner txHash={txHash} nftTokenId={nftTokenId} />
      )}

      <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
        <div className="h-full w-full flex flex-col items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[340px]"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-rhythmrush-gold">MINT</span>
                <span className="text-white"> GEM</span>
              </h1>
              <p className="text-white/80">Get your RhythmRush Gem NFT</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">RUSH Balance:</span>
                <span className="text-rhythmrush-gold font-bold">{parseFloat(rushBalance).toFixed(2)} RUSH</span>
              </div>

              <div className="mb-6">
                <label className="text-white/80 text-sm mb-2 block">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCount(Math.max(1, count - 1))}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition"
                    disabled={count <= 1}
                  >
                    -
                  </button>
                  <span className="text-white text-2xl font-bold w-12 text-center">{count}</span>
                  <button
                    onClick={() => setCount(Math.min(100, count + 1))}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition"
                    disabled={count >= 100}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-white/80">Price per Gem:</span>
                  <span className="text-white font-semibold">34 RUSH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Total Cost:</span>
                  <span className="text-rhythmrush-gold font-bold text-lg">{totalCost} RUSH</span>
                </div>
              </div>

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

