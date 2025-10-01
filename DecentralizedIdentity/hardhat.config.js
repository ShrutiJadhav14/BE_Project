import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"; // Automatically loads .env variables

export default {
  solidity: "0.8.20",
  networks: {
    // Local Hardhat network (dummy ETH for testing)
    hardhat: {
      chainId: 31337
    },

    // Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_URL || "",         // Your Sepolia RPC URL
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Your wallet private key
      chainId: 11155111
    }
  },

};
