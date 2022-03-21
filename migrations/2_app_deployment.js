const Staker = artifacts.require("Staker");
const RewardToken = artifacts.require("RewardToken");

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');


module.exports = async function (deployer) {

  await deployer.deploy(RewardToken, "Clogic Stake Token", "CLS", 10, 100, true);
  let rewardToken = await RewardToken.deployed();

  const stakerInstance = await deployProxy(Staker, [rewardToken.address], { deployer });
  staker = await upgradeProxy(stakerInstance.address, Staker, { deployer });

};
