import { expect } from "chai";
import { ethers } from "hardhat";

describe("RewardToken Contract", function () {
  const getDeployedContract = async function () {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(250, 50, true);
    await rewardToken.deployed();
    return rewardToken;
  };

  describe("Deploy", function () {
    it("Should deploy RewardToken with expected values", async function () {
      const rewardToken = await getDeployedContract();

      expect(await rewardToken.rewardRate()).to.equal(250);
      expect(await rewardToken.withdrawFee()).to.equal(50);
      expect(await rewardToken.withdrawFeeEnable()).to.equal(true);
    });

    it("Should not deploy RewardToken with invalid _rewardRate", async function () {
      const RewardToken = await ethers.getContractFactory("RewardToken");

      expect(RewardToken.deploy(1001, 50, true)).to.be.revertedWith(
        "_rewardRate must be minor than 1000"
      );
    });

    it("Should not deploy RewardToken with invalid _withdrawFee", async function () {
      const RewardToken = await ethers.getContractFactory("RewardToken");

      expect(RewardToken.deploy(250, 1001, true)).to.be.revertedWith(
        "_withdrawFee must be minor than 1000"
      );
    });
  });

  describe("mint method", function () {
    it("Should mint the expected tokens to the given address", async function () {
      const rewardToken = await getDeployedContract();

      const mint = await rewardToken.mint(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        ethers.utils.parseEther("250")
      );
      await mint.wait();

      expect(
        await rewardToken.balanceOf(
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        )
      ).to.equal(ethers.utils.parseEther("250"));
    });

    it("Should not be called by other that's not the owner", async function () {
      const rewardToken = await getDeployedContract();
      const [, account2] = await ethers.getSigners();

      expect(
        rewardToken
          .connect(account2)
          .mint(
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            ethers.utils.parseEther("250")
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("setRewardRate method", function () {
    it("Should set rewardRate with expected value", async function () {
      const rewardToken = await getDeployedContract();

      const setSetRewardRate = await rewardToken.setRewardRate(255);
      await setSetRewardRate.wait();
      expect(await rewardToken.rewardRate()).to.equal(255);
    });

    it("Should not set rewardRate with invalid value", async function () {
      const rewardToken = await getDeployedContract();

      expect(rewardToken.setRewardRate(1001)).to.be.revertedWith(
        "_rewardRate must be minor than 1000"
      );
      expect(rewardToken.setRewardRate(250)).to.be.revertedWith(
        "_rewardRate must be different"
      );
      expect(await rewardToken.rewardRate()).to.equal(250);
    });

    it("Should not be called by other that's not the default admin", async function () {
      const rewardToken = await getDeployedContract();
      const [, account2] = await ethers.getSigners();

      expect(
        rewardToken.connect(account2).setRewardRate(255)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("setWithdrawFee method", function () {
    it("Should set withdrawFee with expected value", async function () {
      const rewardToken = await getDeployedContract();

      const setSetWithdrawFee = await rewardToken.setWithdrawFee(75);
      await setSetWithdrawFee.wait();
      expect(await rewardToken.withdrawFee()).to.equal(75);
    });

    it("Should not set withdrawFee with invalid value", async function () {
      const rewardToken = await getDeployedContract();

      expect(rewardToken.setWithdrawFee(1001)).to.be.revertedWith(
        "_withdrawFee must be minor than 1000"
      );
      expect(rewardToken.setWithdrawFee(50)).to.be.revertedWith(
        "_withdrawFee must be different"
      );
      expect(await rewardToken.withdrawFee()).to.equal(50);
    });
  });

  describe("setWithdrawFeeEnable method", function () {
    it("Should set withdrawFeeEnable with expected value", async function () {
      const rewardToken = await getDeployedContract();

      const setSetWithdrawFeeEnable = await rewardToken.setWithdrawFeeEnable(
        false
      );
      await setSetWithdrawFeeEnable.wait();
      expect(await rewardToken.withdrawFeeEnable()).to.equal(false);
    });

    it("Should not set withdrawFeeEnable with invalid value", async function () {
      const rewardToken = await getDeployedContract();

      expect(rewardToken.setWithdrawFeeEnable(true)).to.be.revertedWith(
        "_withdrawFeeEnable must be different"
      );
      expect(await rewardToken.withdrawFeeEnable()).to.equal(true);
    });
  });
});
