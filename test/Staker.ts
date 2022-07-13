import { expect } from "chai";
import { ethers } from "hardhat";

describe("Staker Contract", function () {
  const getDeployedContracts = async function () {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const Staker = await ethers.getContractFactory("Staker");

    const rewardToken = await RewardToken.deploy(250, 50, true);
    await rewardToken.deployed();

    const staker = await Staker.deploy(rewardToken.address);
    await staker.deployed();

    return { rewardToken, staker };
  };

  describe("Deploy", function () {
    it("Should deploy staker with expected values", async function () {
      const { staker } = await getDeployedContracts();

      expect(await staker.lockSeconds()).to.equal(0);
      expect(await staker.lastBlockNumber()).to.equal(0);
      expect(await staker.totalSupply()).to.equal(0);
      expect(await staker.internalSupply()).to.equal(0);
      expect(await staker.totalStakers()).to.equal(0);
    });
  });
});
