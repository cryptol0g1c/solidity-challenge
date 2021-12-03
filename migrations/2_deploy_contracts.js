const RewardToken = artifacts.require("RewardToken");
const Staker = artifacts.require("Staker");
var BigNumber = require('big-number');

module.exports = async function(deployer) {
  await deployer.deploy(RewardToken, "Reward Token", "RT", new BigNumber("300000000000000000000"));
  const instance = await RewardToken.deployed();
  await deployer.deploy(Staker, instance.address);
  const instance2 = await Staker.deployed();

  console.log("token address: ", instance.address);
  console.log("staker address: ", instance2.address);
};
