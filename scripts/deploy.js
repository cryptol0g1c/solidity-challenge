const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy("RewardToken", "RWT", ethers.utils.parseEther("1000000"));
  await rewardToken.deployed();
  console.log("RewardToken deployed to:", rewardToken.address);

  const Staker = await ethers.getContractFactory("Staker");
  const staker = await Staker.deploy(rewardToken.address);
  await staker.deployed();
  console.log("Staker deployed to: ", staker.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
