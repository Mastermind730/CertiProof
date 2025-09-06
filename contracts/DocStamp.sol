//SPDX-License-Identifier:MIT
// DocStamp.sol

pragma solidity ^0.8.15;

import './Ownable.sol';

contract DocStamp is Ownable {
  mapping (bytes32 => address) public records;

  event CertificateIssued(bytes32 indexed record, uint256 timestamp, bool returnValue);

  function issueCertificate(string calldata name, string calldata details) external onlyOwner {
    bytes32 certificate = keccak256(abi.encodePacked(name, details));
    require(certificate != keccak256(abi.encodePacked("")));
    records[certificate] = msg.sender;
    emit CertificateIssued(certificate, block.timestamp, true);
  }

  function owningAuthority() external view returns (address) {
    return owner;
  }

  function verifyCertificate(string calldata name, string calldata details, bytes32 certificate) external view
   returns (bool) {
    bytes32 certificate2 = keccak256(abi.encodePacked(name, details));
    // are certificates the same?
    if (certificate == certificate2) {
      // does the certificate exist on the blockchain?
      if (records[certificate] == owner) {
        return true;
      }
    }
    return false;
  }
}