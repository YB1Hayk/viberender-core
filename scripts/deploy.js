/**
 * VibeRender — Contract Deployment Script
 *
 * Deploys RenderEscrow and JobRegistry to the target network and links them:
 *   - JobRegistry.setEscrow(escrow) so on-chain proof verification can be wired.
 *   - The deployer becomes the initial validator/prover.
 *   - Transfer both roles to a multi-sig before scaling escrow values.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network baseSepolia
 *   npx hardhat run scripts/deploy.js --network base
 *   npx hardhat run scripts/deploy.js --network arbitrumSepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  // ── Link the two contracts ────────────────────────────────────────────────
  console.log("\nLinking JobRegistry.escrow -> RenderEscrow...");
  const linkTx = await registry.setEscrow(escrowAddress);
  await linkTx.wait();
  console.log("  linked ✓");

  // ── Save deployment record ────────────────────────────────────────────────
  const record = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString().slice(0, 10),
    deployer: deployer.address,
    contracts: {
      RenderEscrow: {
        address: escrowAddress,
        constructorArgs: [deployer.address],
        explorer: `https://${hre.network.name === "base" ? "basescan.org" : hre.network.name === "arbitrum" ? "arbiscan.io" : "sepolia.basescan.org"}/address/${escrowAddress}`,
      },
      JobRegistry: {
        address: registryAddress,
        constructorArgs: [deployer.address],
        explorer: `https://${hre.network.name === "base" ? "basescan.org" : hre.network.name === "arbitrum" ? "arbiscan.io" : "sepolia.basescan.org"}/address/${registryAddress}`,
      },
    },
  };
  const dir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${hre.network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  console.log(`  deployment record: deployments/${hre.network.name}.json`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log("Deployment complete.");
  console.log("─────────────────────────────────────────");
  console.log("Update src/config/contracts.ts in the frontend:");
  console.log(`  RENDER_ESCROW_ADDRESS[<chainId>] = "${escrowAddress}"`);
  console.log(`  JOB_REGISTRY_ADDRESS[<chainId>]  = "${registryAddress}"`);
  console.log("\nNext steps:");
  console.log("  1. Verify contracts on the block explorer:");
  console.log(`     npx hardhat verify --network ${hre.network.name} ${escrowAddress} ${deployer.address}`);
  console.log(`     npx hardhat verify --network ${hre.network.name} ${registryAddress} ${deployer.address}`);
  console.log("  2. Transfer validator/prover to a multi-sig before scaling escrow values.");
  console.log("─────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
