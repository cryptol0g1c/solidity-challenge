import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardToken, Staker } from "../typechain";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("RewardToken", () => {
  const name = "RewardToken";
  const symbol = "RWD";
  const withdrawFee = parseEther("2");
  const withdrawFeeEnabled = false;
  const TOTAL_REWARD_PRECISION = parseEther("1");
  const rewardRate = parseEther("10");
  let rewardToken: RewardToken;
  let staker: Staker;
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;
  let acc4: SignerWithAddress;
  before(async () => {
    [owner, acc1, acc2, acc3, acc4] = await ethers.getSigners();
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
    it("Should add the deposited amount to the total stake", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      expect(await staker.totalStake()).to.equal(parseEther("100"));
    });
    it("Should transfer the deposited amount from acc1 address balance to the staker contract ", async () => {
      const balanceBefore = await rewardToken.balanceOf(acc1.address);
      await staker.connect(acc1).deposit(parseEther("100"));
      const balanceAfter = await rewardToken.balanceOf(acc1.address);
      expect(balanceBefore).to.equal(balanceAfter.add(parseEther("100")));
    });
    it("Should emit Deposit event with address and amount", async () => {
      await expect(staker.connect(acc1).deposit(parseEther("100")))
        .to.emit(staker, "Deposit")
        .withArgs(acc1.address, parseEther("100"));
    });
    it("Should add multiple deposits to the total stake", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("50"));
      expect(await staker.totalStake()).to.equal(parseEther("150"));
    });
    it("Should map the address with the staked amount", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const stakerAcc1 = await staker.stakers(acc1.address);
      expect(stakerAcc1.stakeAmount).to.equal(parseEther("100"));
    });
    it("Should update the latestPaidBlock on the staker contract", async () => {
      const lastPaidBlockBefore = await staker.lastPaidBlock();
      await staker.connect(acc1).deposit(parseEther("100"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      expect(lastPaidBlockAfter.toNumber()).to.be.above(
        lastPaidBlockBefore.toNumber()
      );
    });
    it("Should update correctly the totalReward for the first time", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const lastPaidBlockBefore = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      await staker.connect(acc2).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockBefore)
        .mul(rewardRate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward).to.be.equal(totalReward);
    });
    it("totalReward should be the same as the reward snapshot mapped for acc2 deposit", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("50"));
      const totalReward = await staker.totalReward();
      const stakerAcc2 = await staker.stakers(acc2.address);
      expect(stakerAcc2.rewardSnapShot).to.be.equal(totalReward);
    });
    it("Should update the totalReward AFTER the first time", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      const totalRewardprev = await staker.totalReward();
      const lastPaidBlockBefore = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      await staker.connect(acc3).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockBefore)
        .mul(rewardRate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward.add(totalRewardprev)).to.be.equal(totalReward);
    });
    it("totalReward should be the same as the reward snapshot mapped for acc3 deposit", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      await staker.connect(acc3).deposit(parseEther("100"));
      const totalReward = await staker.totalReward();
      const stakerAcc3 = await staker.stakers(acc3.address);
      expect(stakerAcc3.rewardSnapShot).to.be.equal(totalReward);
    });
    it("Should update the totalReward if the rewardRate changes", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100"));
      const totalRewardprev = await staker.totalReward();
      const lastPaidBlockBefore = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      const newRewardrate = parseEther("1");
      await rewardToken.setRewardRate(newRewardrate);
      await staker.connect(acc3).deposit(parseEther("50"));
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockBefore)
        .mul(newRewardrate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward.add(totalRewardprev)).to.be.equal(totalReward);
    });
  });
  describe("Withdraw", () => {
    beforeEach(async () => {
      rewardToken.mint(staker.address, parseEther("10000000000"));
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

    it("Shouldn't allow accounts with no stake", async () => {
      await expect(staker.connect(acc4).withdraw()).to.be.revertedWith(
        "address has no staking"
      );
    });
    it("Should update the total stake", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const totalStakeBefore = await staker.totalStake();
      await staker.connect(acc1).withdraw();
      const totalStakeAfter = await staker.totalStake();
      expect(totalStakeBefore).to.be.equal(
        totalStakeAfter.add(parseEther("100"))
      );
    });
    it("Should delete staker info", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc1).withdraw();
      const stakerAcc1 = await staker.stakers(acc1.address);
      expect(stakerAcc1.rewardSnapShot).to.be.equal(0);
      expect(stakerAcc1.stakeAmount).to.be.equal(0);
    });
    it("Should update the totalReward", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      const lastPaidBlockBefore = await staker.lastPaidBlock();
      const totalStake = await staker.totalStake();
      await staker.connect(acc1).withdraw();
      const lastPaidBlockAfter = await staker.lastPaidBlock();
      const totalReward = await staker.totalReward();
      const expectedReward = lastPaidBlockAfter
        .sub(lastPaidBlockBefore)
        .mul(rewardRate)
        .mul(TOTAL_REWARD_PRECISION)
        .div(totalStake);
      expect(expectedReward).to.be.equal(totalReward);
    });
    it("Should transfer the correct amount to acc2", async () => {
      // - deposit 100 token with rate of 10 tokens per block
      // - 1rst block staking 5 tokens
      // - 2nd  block staking 3.3... tokens
      // - withdaw 108.3... tokens
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100")); // 1
      await staker.connect(acc3).deposit(parseEther("100")); // 2
      const stakerAcc2 = await staker.stakers(acc2.address);
      const balanceBefore = await rewardToken.balanceOf(acc2.address);
      await staker.connect(acc2).withdraw();
      const balanceAfter = await rewardToken.balanceOf(acc2.address);
      const totalReward = await staker.totalReward();
      const expectedTransfer = totalReward
        .sub(stakerAcc2.rewardSnapShot)
        .add(TOTAL_REWARD_PRECISION)
        .mul(stakerAcc2.stakeAmount)
        .div(TOTAL_REWARD_PRECISION);
      expect(expectedTransfer).to.be.equal(balanceAfter.sub(balanceBefore));
    });
    it("Should transfer the correct amount to acc2 substracting the withdraw fee", async () => {
      // - deposit 100 token with rate of 10 tokens per block
      // - 1rst block staking 5 tokens
      // - 2nd  block staking 3.3... tokens
      // - withdaw 108.3 minus fee (2)... tokens
      await rewardToken.enableWithdrawFee(true);
      await staker.connect(acc1).deposit(parseEther("100"));
      await staker.connect(acc2).deposit(parseEther("100")); // 1
      await staker.connect(acc3).deposit(parseEther("100")); // 2
      const stakerAcc2 = await staker.stakers(acc2.address);
      const balanceBefore = await rewardToken.balanceOf(acc2.address);
      await staker.connect(acc2).withdraw();
      const balanceAfter = await rewardToken.balanceOf(acc2.address);
      const totalReward = await staker.totalReward();
      const expectedTransfer = totalReward
        .sub(stakerAcc2.rewardSnapShot)
        .add(TOTAL_REWARD_PRECISION)
        .mul(stakerAcc2.stakeAmount)
        .div(TOTAL_REWARD_PRECISION);
      expect(expectedTransfer.sub(withdrawFee)).to.be.equal(
        balanceAfter.sub(balanceBefore)
      );
    });
    it("Should transfer he withdraw fee to the owner", async () => {
      await rewardToken.enableWithdrawFee(true);
      await staker.connect(acc1).deposit(parseEther("100"));
      const balanceBefore = await rewardToken.balanceOf(owner.address);
      await staker.connect(acc1).withdraw();
      const balanceAfter = await rewardToken.balanceOf(owner.address);
      expect(withdrawFee).to.be.equal(balanceAfter.sub(balanceBefore));
    });
    it("Should emit Withdraw event with address and amount", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
      await expect(staker.connect(acc1).withdraw())
        .to.emit(staker, "Withdraw")
        .withArgs(acc1.address, parseEther("110"));
    });
  });
});
