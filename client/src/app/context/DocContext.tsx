/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ethers, BaseContract } from "ethers";
import Web3Modal from "web3modal";
import { ADDRESS, ABI } from "@/contract";

// Define types for the context value
interface BlockchainContextType {
  contract: BaseContract | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>; // Function to trigger connection
}

// Create context
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
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Use useCallback to memoize the function
  const connectWallet = useCallback(async () => {
    // Prevent multiple connection requests
    if (isConnecting || address) return;

    try {
      setIsConnecting(true);

      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions: {}, // required
      });
      const connection = await web3Modal.connect();
      const _provider = new ethers.BrowserProvider(connection);
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const _contract = new ethers.Contract(ADDRESS, ABI, _signer);

      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setContract(_contract);

      // Listen for account changes
      connection.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          // Handle disconnection
          setAddress(null);
          setSigner(null);
          setContract(null);
          setProvider(null);
        }
      });

    } catch (err) {
      console.error("Error connecting wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, address]); // Dependencies for useCallback

  return (
    <BlockchainContext.Provider value={{ contract, provider, signer, address, isConnecting, connectWallet }}>
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