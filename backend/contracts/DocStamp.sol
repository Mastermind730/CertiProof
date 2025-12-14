//SPDX-License-Identifier:MIT
// DocStamp.sol

pragma solidity ^0.8.15;

import './Ownable.sol';

contract DocStamp {
  // Mapping from PRN (student unique ID) to certificate hash (JWT token)
  mapping (string => string) public certificates;
  
  // Mapping to check if a certificate hash exists
  mapping (string => bool) public certificateExists;

  event CertificateIssued(string indexed prn, string certificateHash, uint256 timestamp);
  event CertificateRevoked(string indexed prn, uint256 timestamp);

  // Issue certificate: Map PRN to certificate hash (JWT token)
  function issueCertificate(string calldata prn, string calldata certificateHash) external onlyOwner {
    require(bytes(prn).length > 0, "PRN cannot be empty");
    require(bytes(certificateHash).length > 0, "Certificate hash cannot be empty");
    require(bytes(certificates[prn]).length == 0, "Certificate already issued for this PRN");
    
    certificates[prn] = certificateHash;
    certificateExists[certificateHash] = true;
    
    emit CertificateIssued(prn, certificateHash, block.timestamp);
  }

  // Get certificate hash by PRN
  function getCertificateByPRN(string calldata prn) external view returns (string memory) {
    require(bytes(certificates[prn]).length > 0, "No certificate found for this PRN");
    return certificates[prn];
  }

  // Verify certificate by PRN and hash
  function verifyCertificate(string calldata prn, string calldata certificateHash) external view returns (bool) {
    return keccak256(abi.encodePacked(certificates[prn])) == keccak256(abi.encodePacked(certificateHash));
  }

  // Verify certificate hash exists
  function verifyCertificateHash(string calldata certificateHash) external view returns (bool) {
    return certificateExists[certificateHash];
  }

  // Revoke certificate (in case of invalidation)
  function revokeCertificate(string calldata prn) external onlyOwner {
    require(bytes(certificates[prn]).length > 0, "No certificate found for this PRN");
    
    string memory hash = certificates[prn];
    delete certificates[prn];
    delete certificateExists[hash];
    
    emit CertificateRevoked(prn, block.timestamp);
  }

  function owningAuthority() external view returns (address) {
    return owner;
  }
}