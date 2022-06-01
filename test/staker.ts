import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardToken, Staker } from "../typechain";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("RewardToken", () => {
  const name = "RewardToken";
  const symbol = "RWD";
  const withdrawFee = parseEther("10");
  const withdrawFeeEnabled = true;
  const TOTAL_REWARD_PRECISION = parseEther("1");
  const rewardRate = parseEther("10");
  let rewardToken: RewardToken;
  let staker: Staker;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;
  before(async () => {
    [, acc1, acc2, acc3] = await ethers.getSigners();
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

    const Staker = await ethers.getContractFactory("Staker");
    staker = await Staker.deploy(rewardToken.address);
  });

  describe("Deployment", () => {
    it("Should be deployed with the right ERC20 address", async () => {
      expect(await staker.rewardToken()).to.equal(rewardToken.address);
    });
  });

  describe("Deposit", () => {
    beforeEach(async () => {
      rewardToken.mint(acc1.address, parseEther("100"));
      await rewardToken
        .connect(acc1)
        .approve(staker.address, parseEther("100"));
      rewardToken.mint(acc2.address, parseEther("100"));
      await rewardToken
        .connect(acc2)
        .approve(staker.address, parseEther("100"));
      rewardToken.mint(acc3.address, parseEther("100"));
      await rewardToken
        .connect(acc3)
        .approve(staker.address, parseEther("100"));
    });
    it("Shouldn't allow to deposit 0 tokens", async () => {
      await expect(staker.connect(acc1).deposit(0)).to.be.revertedWith(
        "amount should can't be 0"
      );
    });
    it("Shouldn't allow to deposit twice", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await expect(
        staker.connect(acc1).deposit(parseEther("100"))
      ).to.be.revertedWith("address already staking");
    });
    it("Should add deposited amount to total stake", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      expect(await staker.totalStake()).to.equal(parseEther("100"));
    });
    it("Should remove deposited amount from acc1 RewardToken balance ", async () => {
      const balancePrev = await rewardToken.balanceOf(acc1.address);
      await staker.connect(acc1).deposit(parseEther("100"));
      const balanceAfter = await rewardToken.balanceOf(acc1.address);
      expect(balancePrev).to.equal(balanceAfter.add(parseEther("100")));
    });
    it("Should emit Deposit event", async () => {
      await expect(staker.connect(acc1).deposit(parseEther("100")))
        .to.emit(staker, "Deposit")
        .withArgs(acc1.address, parseEther("100"));
    });
    it("Should add multiple deposits to total stake", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("50"));
      expect(await staker.totalStake()).to.equal(parseEther("150"));
    });
    it("Should add the address with the staked amount", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const stakerAcc1 = await staker.stakers(acc1.address);
      expect(stakerAcc1.stakeAmount).to.equal(parseEther("100"));
    });
    it("Should update the latestPaidBlock", async () => {
      const lastPaidBlockPrev = await staker.lastPaidBlock();
      await staker.connect(acc1).deposit(parseEther("100"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      console.log("bloques", await staker.totalReward());
      expect(lastPaidBlockAfter.toNumber()).to.be.above(
        lastPaidBlockPrev.toNumber()
      );
    });
    it("Should update correctly the totalReward for the first time", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const lastPaidBlockPrev = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      await staker.connect(acc2).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockPrev)
        .mul(rewardRate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward).to.be.equal(totalReward);
    });
    it("totalReward should be the same as reward snapshot for acc2", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("50"));
      const totalReward = await staker.totalReward();
      const stakerAcc2 = await staker.stakers(acc2.address);
      expect(stakerAcc2.rewardSnapShot).to.be.equal(totalReward);
    });
    it("Should update correctly the totalReward AFTER the first time", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      const totalRewardprev = await staker.totalReward();
      const lastPaidBlockPrev = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      await staker.connect(acc3).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockPrev)
        .mul(rewardRate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward.add(totalRewardprev)).to.be.equal(totalReward);
    });
    it("totalReward should be the same as reward snapshot for acc3", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      await staker.connect(acc3).deposit(parseEther("100"));
      const totalReward = await staker.totalReward();
      const stakerAcc3 = await staker.stakers(acc3.address);
      expect(stakerAcc3.rewardSnapShot).to.be.equal(totalReward);
    });
    it("Should update correctly the totalReward if the rewardRate changes", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      const totalRewardprev = await staker.totalReward();
      const lastPaidBlockPrev = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      const newRewardrate = parseEther("1");
      await rewardToken.setRewardRate(newRewardrate);
      await staker.connect(acc3).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockPrev)
        .mul(newRewardrate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward.add(totalRewardprev)).to.be.equal(totalReward);
    });
  });
});
