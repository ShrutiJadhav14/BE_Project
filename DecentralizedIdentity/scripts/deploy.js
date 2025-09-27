import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contract with account:", deployer.address);

  const Identity = await hre.ethers.getContractFactory("Identity");
  const identity = await Identity.deploy();

  await identity.waitForDeployment();

  console.log("✅ Contract deployed to:", await identity.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
