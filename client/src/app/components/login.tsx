"use client";

import { useState, useEffect } from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

// Define types for user info based on Web3Auth response structure
interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  [key: string]: any;
}

function Login() {
  const router = useRouter();
  const { 
    connect, 
    isConnected, 
    loading: connectLoading, 
    error: connectError 
  } = useWeb3AuthConnect();
  const { 
    disconnect, 
    loading: disconnectLoading, 
    error: disconnectError 
  } = useWeb3AuthDisconnect();
 const { 
  userInfo, 
  loading: userLoading = false,  // Provide default value
  error: userError 
} = useWeb3AuthUser();
  const { address, connector } = useAccount();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Handle successful login and redirect to dashboard
  useEffect(() => {
    if (isConnected && userInfo && !userLoading) {
      const authenticateAndRedirect = async () => {
        setIsRedirecting(true);
        
        try {
          // Send user data to your API endpoint
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              userInfo,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Store token in localStorage for API requests
            if (data.token) {
              localStorage.setItem('token', data.token);
            }
            
            // Redirect to dashboard after successful authentication
            router.push('/dashboard');
          } else {
            console.error('Authentication failed');
            setIsRedirecting(false);
          }
        } catch (err) {
          console.error('Error during authentication:', err);
          setIsRedirecting(false);
        }
      };

      authenticateAndRedirect();
    }
  }, [isConnected, userInfo, userLoading, address, router]);

  const handleConnect = async (): Promise<void> => {
    try {
      await connect();
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            CertiProof
          </h1>
          <p className="text-center text-gray-600 mb-8">Secure authentication powered by Web3</p>

          <div className="space-y-6">
            {!isConnected ? (
              <div className="space-y-4">
                <button 
                  onClick={handleConnect}
                  disabled={connectLoading}
                  className="w-full px-4 py-3 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                >
                  {connectLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.583l1.715 5.349a1 1 0 01-.285 1.049A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Login with Web3
                    </>
                  )}
                </button>
                
                {connectError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {connectError.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 animate-fade-in">
                {isRedirecting ? (
                  <div className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-700">Authentication successful! Redirecting to dashboard...</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-700">Completing authentication...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-center text-xs text-gray-500">
            Secured by Web3Auth & Next.js
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;