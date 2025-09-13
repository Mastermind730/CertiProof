import { Web3Auth, WEB3AUTH_NETWORK } from "@web3auth/modal";

const clientId = "BBMoHyA7lr3upuIj23BKkjzfhE3SKUZRSgRzF6-IWIKpiL0_gY46ovnZifQpJhJ4uFMlBJTVCQ6Ir0jacjch_gU"; // get from https://dashboard.web3auth.io

const web3authOptions={
  clientId,
  web3AuthNetwork:WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  ssr:true,
 }

 const web3auth = new Web3Auth(web3authOptions);

export { web3auth, web3authOptions };
 