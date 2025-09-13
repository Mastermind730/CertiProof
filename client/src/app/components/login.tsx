"use client";

import { useState } from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

function Login() {
  const { connect, isConnected, loading: connectLoading, error: connectError } =
    useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } =
    useWeb3AuthDisconnect();

  // ✅ Web3Auth gives user info directly
  const { userInfo, isLoading: userLoading, error: userError } = useWeb3AuthUser();

  const { address, connector } = useAccount();

  const handleConnect = async () => {
    try {
      await connect();
      // no need to manually fetch userInfo
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const loggedInView = (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800">
          Connected to {connector?.name}
        </h2>
        <div className="mt-2 font-mono text-sm text-gray-600 break-all">
          {address}
        </div>
      </div>

      {/* ✅ User info from hook */}
      {userInfo && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">User Info</h3>
          <p><strong>Name:</strong> {userInfo.name}</p>
          <p><strong>Email:</strong> {userInfo.email}</p>
          {userInfo.profileImage && (
            <img
              src={userInfo.profileImage}
              alt="Profile"
              className="w-16 h-16 rounded-full mt-2"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => disconnect()}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Log Out
        </button>
      </div>

      {disconnectLoading && <div className="text-center text-gray-600">Disconnecting...</div>}
      {disconnectError && <div className="text-center text-red-600">{disconnectError.message}</div>}
    </div>
  );

  const unloggedInView = (
    <div className="grid">
      <button onClick={handleConnect} className="card">
        Login
      </button>
      {connectLoading && <div className="loading">Connecting...</div>}
      {connectError && <div className="error">{connectError.message}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          CertiProof Login
        </h1>

        <div className="space-y-6">
          {isConnected ? loggedInView : unloggedInView}

          {/* Debug console */}
          {userLoading && <div className="text-gray-500">Loading user...</div>}
          {userError && <div className="text-red-500">{userError.message}</div>}
        </div>
      </div>
    </div>
  );
}

export default Login;
