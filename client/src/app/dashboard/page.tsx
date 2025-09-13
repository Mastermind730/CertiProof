"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  wallet_address: string;
}

interface Certificate {
  id: string;
  title: string;
  issuedDate: string;
  issuer: string;
  credentialId: string;
  documentUrl?: string;
  verificationUrl: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        router.push('/login');
      }
    };

    const fetchCertificates = async () => {
      try {
        const response = await fetch('/api/certificates');
        if (response.ok) {
          const certificatesData = await response.json();
          setCertificates(certificatesData);
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchCertificates();
  }, [router]);

  const handleViewCertificate = (certificate: Certificate) => {
    if (certificate.documentUrl) {
      setSelectedCertificate(certificate);
      setShowModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4 md:p-8">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-md p-6 mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CertiProof Dashboard</h1>
          <p className="text-gray-600">Secure credential management platform</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-6 animate-slide-in-left">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Role</h3>
                <p className="text-blue-600 font-semibold capitalize">{user?.role}</p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-teal-800 mb-1">Wallet Address</h3>
                <p className="text-teal-600 font-mono text-sm truncate">{user?.wallet_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-6 animate-slide-in-right">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Certificates</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
              </span>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-64 h-64 mb-6">
                  <svg viewBox="0 0 500 500" className="w-full h-full">
                    <g transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)" fill="#cbd5e1" stroke="none">
                      <path d="M2320 4984 c-494 -48 -950 -230 -1350 -536 -114 -87 -300 -273 -387 -387 -306 -400 -488 -856 -536 -1350 -18 -187 -18 -613 0 -800 48 -494 230 -950 536 -1350 87 -114 273 -300 387 -387 400 -306 856 -488 1350 -536 187 -18 613 -18 800 0 494 48 950 230 1350 536 114 87 300 273 387 387 306 400 488 856 536 1350 18 187 18 613 0 800 -48 494 -230 950 -536 1350 -87 114 -273 300 -387 387 -400 306 -856 488 -1350 536 -187 18 -613 18 -800 0z m810 -329 c425 -43 815 -208 1135 -480 112 -96 296 -280 392 -392 272 -320 437 -710 480 -1135 19 -192 19 -568 0 -760 -43 -425 -208 -815 -480 -1135 -96 -112 -280 -296 -392 -392 -320 -272 -710 -437 -1135 -480 -192 -19 -568 -19 -760 0 -425 43 -815 208 -1135 480 -112 96 -296 280 -392 392 -272 320 -437 710 -480 1135 -19 192 -19 568 0 760 43 425 208 815 480 1135 96 112 280 296 392 392 320 272 710 437 1135 480 192 19 568 19 760 0z"/>
                      <path d="M2190 3435 l-385 -385 118 -118 117 -117 268 268 267 267 853 -853 852 -852 118 118 117 117 -970 970 c-533 533 -972 970 -975 970 -3 0 -178 -173 -390 -385z"/>
                    </g>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No certificates yet</h3>
                <p className="text-gray-500">Your issued certificates will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((certificate, index) => (
                  <div
                    key={certificate.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {new Date(certificate.issuedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">{certificate.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">Issued by: {certificate.issuer}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-gray-500">ID: {certificate.credentialId}</span>
                      
                      {certificate.documentUrl && (
                        <button
                          onClick={() => handleViewCertificate(certificate)}
                          className="px-3 py-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-teal-600 transition-colors duration-200"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">{selectedCertificate.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <iframe
                src={selectedCertificate.documentUrl}
                className="w-full h-96 border border-gray-200 rounded-lg"
                title={`Certificate: ${selectedCertificate.title}`}
              />
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <a
                href={selectedCertificate.documentUrl}
                download
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-colors duration-200 mr-3"
              >
                Download
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}