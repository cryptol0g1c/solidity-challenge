var RewardToken = artifacts.require("./RewardToken.sol");
var Staker = artifacts.require("./Staker.sol");

module.exports = function (deployer) {
  deployer.deploy(RewardToken, "Reward Token", "RWDTKN", 1, 100).then(async function () {
    await deployer.deploy(Staker, RewardToken.address);
    const token = await RewardToken.deployed();
    const staker = await Staker.deployed();
    await token.transfer(Staker.address, web3.utils.toWei(web3.utils.toBN(100000), "ether"))
    console.log(await token.balanceOf(Staker.address))
  });
};