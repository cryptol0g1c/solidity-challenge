/* eslint-disable no-process-exit */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  let RewardToken = await hre.ethers.getContractFactory("RewardToken");
  RewardToken = await RewardToken.deploy(25, 5, true);
  await RewardToken.deployed();

  let Staker = await hre.ethers.getContractFactory("Staker");
  Staker = await Staker.deploy(RewardToken.address);
  await Staker.deployed();

  RewardToken.mint(250, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  RewardToken.mint(250, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  RewardToken.transferOwnership(Staker.address);

  console.log("RewardToken deployed to:", RewardToken.address);
  console.log("Deployer address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
