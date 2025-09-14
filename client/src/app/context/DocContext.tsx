/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers, BrowserProvider, Contract, Signer } from "ethers";
import { ADDRESS, ABI } from "@/contract";

// Define types for the context value
interface BlockchainContextType {
  account: string | null;
  contract: Contract | null;
}

// Create context with proper typing
const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

// Define props for the provider
interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider = ({ children }: BlockchainProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    // Check if window.ethereum exists and has the correct type
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const init = async () => {
        try {
          const provider = new BrowserProvider((window as any).ethereum);
          const signer: Signer = await provider.getSigner();

          // Request wallet connection with proper typing
          const accounts: string[] = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);

          // Initialize contract
          const contractInstance = new Contract(
            ADDRESS,
            ABI,
            signer
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Error initializing blockchain context:", error);
        }
      };

      init();
    }
  }, []);

  return (
    <BlockchainContext.Provider value={{ account, contract }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = (): BlockchainContextType => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};