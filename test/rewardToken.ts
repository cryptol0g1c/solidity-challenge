import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardToken } from "../typechain";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe.only("RewardToken", () => {
  const name = "RewardToken";
  const symbol = "RWD";
  const withdrawFee = parseEther("10");
  const withdrawFeeEnabled = true;
  const rewardRate = parseEther("10");
  let rewardToken: RewardToken;
  let acc1: SignerWithAddress;

  before(async () => {
    [, acc1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy(
      name,
      symbol,
      withdrawFeeEnabled,
      rewardRate,
      withdrawFee
    );
    await rewardToken.deployed();
  });

  describe("Deployment", () => {
    it("Should be deployed with the right ERC20 arguments: name, symbol.", async () => {
      expect(await rewardToken.name()).to.equal(name);
      expect(await rewardToken.symbol()).to.equal(symbol);
    });

    it("Should be deployed with the right aditional arguments:withdrawFee,withdrawFeeEnabled, rewardRate ", async () => {
      expect(await rewardToken.withdrawFee()).to.equal(withdrawFee);
      expect(await rewardToken.withdrawFeeEnabled()).to.equal(
        withdrawFeeEnabled
      );
      expect(await rewardToken.rewardRate()).to.equal(rewardRate);
    });
  });

  describe("mint", () => {
    it("Should be avaliable for the owner only", async () => {
      await expect(
        rewardToken.connect(acc1).mint(acc1.address, parseEther("100"))
      ).to.be.reverted;
    });

    it("Should mint the amount to the specified address", async () => {
      await rewardToken.mint(acc1.address, parseEther("100"));
      const balance = await rewardToken.balanceOf(acc1.address);
      expect(balance).to.equal(parseEther("100"));
    });
  });

  describe("setWithdrawFee", () => {
    it("Should be avaliable for the owner only", async () => {
      await expect(rewardToken.connect(acc1).setWithdrawFee(parseEther("100")))
        .to.be.reverted;
    });

    it("Shouldn't let setting withdraw fee to 0 ", async () => {
      await expect(rewardToken.setWithdrawFee(0)).to.be.revertedWith(
        "Withdraw fee cant' be 0"
      );
    });

    it("Should emit event", async () => {
      const withdrawFee = parseEther("3");
      await expect(rewardToken.setWithdrawFee(withdrawFee))
        .to.emit(rewardToken, "WithdrawFeeUpdated")
        .withArgs(withdrawFee);
    });
    it("Should change withdraw fee", async () => {
      const withdrawFee = parseEther("3");
      await rewardToken.setWithdrawFee(withdrawFee);
      expect(await rewardToken.withdrawFee()).to.equal(withdrawFee);
    });
  });

  describe("enableWithdrawFee", () => {
    it("Should be avaliable for the owner only", async () => {
      await expect(rewardToken.connect(acc1).enableWithdrawFee(false)).to.be
        .reverted;
    });

    it("Should emit event", async () => {
      await expect(rewardToken.enableWithdrawFee(false))
        .to.emit(rewardToken, "WithdrawFeeToggled")
        .withArgs(false);
    });

    it("Should toggle withdraw fee", async () => {
      await rewardToken.enableWithdrawFee(false);
      expect(await rewardToken.withdrawFeeEnabled()).to.equal(false);
    });
  });

  describe("setRewardRate", () => {
    it("Should be avaliable for the owner only", async () => {
      await expect(rewardToken.connect(acc1).setRewardRate(parseEther("100")))
        .to.be.reverted;
    });

    it("Shouldn't let setting reward rate to 0 ", async () => {
      await expect(rewardToken.setRewardRate(0)).to.be.revertedWith(
        "Reward rate cant' be 0"
      );
    });

    it("Should emit event", async () => {
      const rewardRate = parseEther("3");
      await expect(rewardToken.setRewardRate(rewardRate))
        .to.emit(rewardToken, "RewardRateUpdated")
        .withArgs(rewardRate);
    });
    it("Should change reward rate", async () => {
      const rewardRate = parseEther("3");
      await rewardToken.setRewardRate(rewardRate);
      expect(await rewardToken.rewardRate()).to.equal(rewardRate);
    });
  });
});
