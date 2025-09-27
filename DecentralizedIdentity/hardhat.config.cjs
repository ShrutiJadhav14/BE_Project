require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",   // ✅ Match your Lock.sol pragma
  },
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
