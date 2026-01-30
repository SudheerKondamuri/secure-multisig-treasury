import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment...");

  // Get signers
  const [deployer, owner2, owner3] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MultiSigWallet with 3 owners and 2 required confirmations
  const initialOwners = [deployer.address, owner2.address, owner3.address];
  const requiredConfirmations = 2;

  console.log("\nDeploying MultiSigWallet...");
  console.log("Initial Owners:", initialOwners);
  console.log("Required Confirmations:", requiredConfirmations);

  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const wallet = await MultiSigWallet.deploy(initialOwners, requiredConfirmations);

  await wallet.waitForDeployment();
  const walletAddress = await wallet.getAddress();

  console.log("\n✅ MultiSigWallet deployed to:", walletAddress);

  // Verify deployment
  const owners = await wallet.getOwners();
  const required = await wallet.required();
  console.log("\nVerification:");
  console.log("- Owners:", owners);
  console.log("- Required confirmations:", required.toString());

  // Fund the wallet with some ETH for testing
  const fundAmount = ethers.parseEther("10");
  console.log("\nFunding wallet with", ethers.formatEther(fundAmount), "ETH...");
  const tx = await deployer.sendTransaction({
    to: walletAddress,
    value: fundAmount,
  });
  await tx.wait();
  console.log("✅ Wallet funded");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    contractAddress: walletAddress,
    owners: initialOwners,
    requiredConfirmations: requiredConfirmations,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Save to file
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to deployments/localhost.json");

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json");
  const frontendAbiPath = path.join(__dirname, "../frontend/src/abis");
  
  if (!fs.existsSync(frontendAbiPath)) {
    fs.mkdirSync(frontendAbiPath, { recursive: true });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(
    path.join(frontendAbiPath, "MultiSigWallet.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("✅ ABI copied to frontend");

  console.log("\n📝 Add this to your .env file:");
  console.log(`REACT_APP_CONTRACT_ADDRESS=${walletAddress}`);
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
