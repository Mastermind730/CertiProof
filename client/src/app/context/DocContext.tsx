/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers, Contract, BaseContract } from "ethers";
import Web3Modal from "web3modal";
import { ADDRESS, ABI } from "@/contract";

// Define types for the context value
interface BlockchainContextType {
  contract: BaseContract | null;
  provider: ethers.BrowserProvider | null; // Use BrowserProvider for client-side
  signer: ethers.Signer | null;
  address: string | null;
}

// Create context with proper typing
const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

// Define props for the provider
interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider = ({ children }: BlockchainProviderProps) => {
  const [contract, setContract] = useState<BaseContract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();

        // Use the provider from the user's wallet connection
        const _provider = new ethers.BrowserProvider(connection);
        
        // Get the signer from the provider, which is the connected user
        const _signer = await _provider.getSigner();

        const _address = await _signer.getAddress();
        
        // Initialize the contract with the user's signer
        const _contract = new ethers.Contract(ADDRESS, ABI, _signer);

        setProvider(_provider);
        setSigner(_signer);
        setAddress(_address);
        setContract(_contract);

      } catch (err) {
        console.error("Error initializing Web3:", err);
      }
    };

    initializeContract();
  }, []);

  return (
    <BlockchainContext.Provider value={{ contract, provider, signer, address }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};