const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = "immense defense pledge say recipe minute usual steak second hover fade empty sock night steel";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "5777"
    },
    sepolia: {
      provider: () => new HDWalletProvider(mnemonic,"https://eth-sepolia.g.alchemy.com/v2/hhnZL7TzL20tzfZb2flv7fBiK_1xP6gk"),
      network_id: 11155111,
      gas: 4500000,
      gasPrice: 10000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.15",    // Specify the compiler version
      settings: {
        optimizer: {
          enabled: true,  // Set to true for optimization
          runs: 200        // The number of optimizer runs
        },
        viaIR: false,      // Set to true to enable IR compilation
      }
    }
  }
};