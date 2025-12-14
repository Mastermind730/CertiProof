import { Web3Auth, WEB3AUTH_NETWORK } from "@web3auth/modal";

const clientId = "BBMoHyA7lr3upuIj23BKkjzfhE3SKUZRSgRzF6-IWIKpiL0_gY46ovnZifQpJhJ4uFMlBJTVCQ6Ir0jacjch_gU"; // get from https://dashboard.web3auth.io

const web3authOptions={
  clientId,
  web3AuthNetwork:WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig: {
    chainNamespace: "eip155",
    chainId: "0xaa36a7", // Sepolia testnet
    rpcTarget: "https://eth-sepolia.g.alchemy.com/v2/hhnZL7TzL20tzfZb2flv7fBiK_1xP6gk",
    displayName: "Ethereum Sepolia Testnet",
    blockExplorer: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
  uiConfig: {
    appName: "CertiProof",
    theme: {
      primary: "#4f46e5",
    },
    mode: "light",
    logoLight: "https://web3auth.io/images/web3auth-logo.svg",
    logoDark: "https://web3auth.io/images/web3auth-logo---Dark.svg",
    defaultLanguage: "en",
  },
 }

 const web3auth = new Web3Auth(web3authOptions);

export { web3auth, web3authOptions };