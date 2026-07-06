/**
 * VibeRender — Contract Deployment Script
 *
 * Deploys RenderEscrow and JobRegistry to the target network.
 * The deployer wallet becomes the initial validator/prover.
 * Transfer both roles to a multi-sig before mainnet launch.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network baseSepolia
 *   npx hardhat run scripts/deploy.js --network arbitrumSepolia
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("─────────────────────────────────────────");
  console.log("VibeRender Contract Deployment");
  console.log("─────────────────────────────────────────");
  console.log("Network:  ", hre.network.name);
  console.log("Deployer: ", deployer.address);
  console.log(
    "Balance:  ",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("─────────────────────────────────────────\n");

  // ── RenderEscrow ──────────────────────────────────────────────────────────
  console.log("Deploying RenderEscrow...");
  const RenderEscrow = await hre.ethers.getContractFactory("RenderEscrow");
  const escrow = await RenderEscrow.deploy(deployer.address); // deployer = initial validator
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("  RenderEscrow:", escrowAddress);

  // ── JobRegistry ───────────────────────────────────────────────────────────
  console.log("\nDeploying JobRegistry...");
  const JobRegistry = await hre.ethers.getContractFactory("JobRegistry");
  const registry = await JobRegistry.deploy(deployer.address); // deployer = initial prover
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("  JobRegistry: ", registryAddress);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log("Deployment complete.");
  console.log("─────────────────────────────────────────");
  console.log("Update src/config/contracts.ts in the frontend:");
  console.log(`  RENDER_ESCROW_ADDRESS[<chainId>] = "${escrowAddress}"`);
  console.log("\nNext steps:");
  console.log("  1. Verify contracts on the block explorer:");
  console.log(`     npx hardhat verify --network ${hre.network.name} ${escrowAddress} ${deployer.address}`);
  console.log(`     npx hardhat verify --network ${hre.network.name} ${registryAddress} ${deployer.address}`);
  console.log("  2. Transfer validator/prover to a multi-sig before mainnet.");
  console.log("─────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
