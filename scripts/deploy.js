const hre = require("hardhat");
const { ethers } = require("hardhat");
const provider = ethers.provider;
const { rewardTokenParams } = require("../rewardTokenArguments.js");

async function main() {
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy(...rewardTokenParams);
  await rewardToken.deployed();
  console.log("RewardToken deployed to:", rewardToken.address);

  const Staker = await ethers.getContractFactory("Staker");
  const startBlock = (await provider.getBlock("latest")).number + 100000;
  const staker = await Staker.deploy(rewardToken.address, startBlock);
  console.log("Staker deployed to: ", staker.address);
  console.log("Start block: ", startBlock);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });