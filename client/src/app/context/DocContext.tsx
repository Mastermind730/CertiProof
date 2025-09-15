/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers, Contract } from "ethers";
import Web3Modal from "web3modal"; // make sure it's installed
import { ADDRESS, ABI } from "@/contract";

// Define types for the context value
interface BlockchainContextType {
  contract: Contract | null;
  provider: ethers.providers.Web3Provider | null;
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
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();

        const _provider = new ethers.BrowserProvider(connection);
        await _provider.send("eth_requestAccounts", []);

        const _signer = await _provider.getSigner();
        const _address = await _signer.getAddress();

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
