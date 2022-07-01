/* eslint-disable no-process-exit */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  let NFTContract = await hre.ethers.getContractFactory("NFTContract");
  NFTContract = await NFTContract.deploy();
  await NFTContract.deployed();

  console.log("NFTContract deployed to:", NFTContract.address);
  console.log("Deployer address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
