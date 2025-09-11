import { useState } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

export default function useWallet() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    } else {
      alert("MetaMask not detected!");
    }
  };

  return { account, connectWallet };
}
