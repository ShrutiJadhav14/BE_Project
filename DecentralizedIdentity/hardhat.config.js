import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

export default {
  solidity: {
    compilers: [{ version: "0.8.28" }],
  },
  networks: {
    hardhat: {
      chainId: 31337, // ✅ Keep chainId fixed for consistency
    },
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31337,
    },
  },
};
