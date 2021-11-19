const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Staker contract", function () {
  const rewardTokenName = "RewardToken";
  const rewardTokenSymbol = "RT";
  const stakingTokenName = "StakingToken";
  const stakingTokenSymbol = "ST";
  const withdrawFeePercent = 1000; // fee: 10%, denominator: 10000
  const day = 86400;
  let RewardToken;
  let StakingToken;
  let Staker;
  let ceo;
  let owner;
  let rewardsDistribution;
  let user1;
  let user2;

  // 7 day, 100 tokens per block, around 15 second per day
  const MINT_AMOUNT = BigNumber.from((86400 * 7 * 100) / 15).mul(
    BigNumber.from((1e18).toString())
  );

  const STAKE_AMOUNT = BigNumber.from(10000).mul(
    BigNumber.from((1e18).toString())
  );

  beforeEach(async function () {
    RewardToken = await ethers.getContractFactory("RewardToken");
    StakingToken = await ethers.getContractFactory("RewardToken");
    Staker = await ethers.getContractFactory("Staker");

    [ceo, owner, rewardsDistribution, user1, user2] = await ethers.getSigners();

    RewardToken = await RewardToken.deploy(rewardTokenName, rewardTokenSymbol);
    StakingToken = await StakingToken.deploy(
      stakingTokenName,
      stakingTokenSymbol
    );
    Staker = await Staker.deploy(
      owner.address,
      rewardsDistribution.address,
      RewardToken.address,
      StakingToken.address,
      withdrawFeePercent
    );
  });

  beforeEach(async function () {
    await RewardToken.connect(ceo).mint(Staker.address, MINT_AMOUNT);
    await Staker.connect(rewardsDistribution).notifyRewardAmount(MINT_AMOUNT);
    await StakingToken.connect(ceo).mint(user1.address, STAKE_AMOUNT);
    await StakingToken.connect(ceo).mint(user2.address, STAKE_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set rewards token on constructor", async () => {
      expect(await Staker.rewardsToken()).to.equal(RewardToken.address);
    });

    it("Should staking token on constructor", async () => {
      expect(await Staker.stakingToken()).to.equal(StakingToken.address);
    });

    it("Should set owner on constructor", async () => {
      const ownerAddress = await Staker.owner();
      expect(ownerAddress).to.equal(owner.address);
    });
  });

  describe("isActiveWithdrawFee()", function () {
    it("Should withdraw fee is enable", async function () {
      await Staker.connect(owner).isActiveWithdrawFee(true);
      expect(await Staker.withdrawFeeIsActive()).to.equal(true);
    });

    it("Should withdraw fee is disable", async function () {
      await Staker.connect(owner).isActiveWithdrawFee(false);
      expect(await Staker.withdrawFeeIsActive()).to.equal(false);
    });

    it("Should caller is owner", async function () {
      await expect(
        Staker.connect(user1).isActiveWithdrawFee(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("stake()", function () {
    it("Should totalSupply", async function () {
      const beforeTotalSupply = await Staker.totalSupply();
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      expect(await Staker.connect(user1).stake(STAKE_AMOUNT))
        .to.emit(Staker, "Staked")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterTotalSupply = await Staker.totalSupply();
      expect(beforeTotalSupply.add(STAKE_AMOUNT)).to.equal(afterTotalSupply);
    });

    it("Should users balance", async function () {
      const beforeBalance = await Staker.balanceOf(user1.address);
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      expect(await Staker.connect(user1).stake(STAKE_AMOUNT))
        .to.emit(Staker, "Staked")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterBalance = await Staker.balanceOf(user1.address);
      expect(beforeBalance.add(STAKE_AMOUNT)).to.equal(afterBalance);
    });

    it("Should Staker contract balance", async function () {
      const beforeBalance = await StakingToken.balanceOf(Staker.address);
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      expect(await Staker.connect(user1).stake(STAKE_AMOUNT))
        .to.emit(Staker, "Staked")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterBalance = await StakingToken.balanceOf(Staker.address);
      expect(beforeBalance.add(STAKE_AMOUNT)).to.equal(afterBalance);
    });

    it("Can't stake 0", async () => {
      await expect(Staker.stake("0")).to.be.revertedWith("Can't stake 0");
    });
  });

  describe("withdraw()", function () {
    beforeEach(async function () {
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      expect(await Staker.connect(user1).stake(STAKE_AMOUNT))
        .to.emit(Staker, "Staked")
        .withArgs(user1.address, STAKE_AMOUNT);
    });

    it("Should totalSupply", async function () {
      const beforeTotalSupply = await Staker.totalSupply();
      expect(await Staker.connect(user1).withdraw(STAKE_AMOUNT))
        .to.emit(Staker, "Withdrawn")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterTotalSupply = await Staker.totalSupply();
      expect(beforeTotalSupply.sub(STAKE_AMOUNT)).to.equal(afterTotalSupply);
    });

    it("Should users balance", async function () {
      const beforeBalance = await Staker.balanceOf(user1.address);
      expect(await Staker.connect(user1).withdraw(STAKE_AMOUNT))
        .to.emit(Staker, "Withdrawn")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterBalance = await Staker.balanceOf(user1.address);
      expect(beforeBalance.sub(STAKE_AMOUNT)).to.equal(afterBalance);
    });

    it("Should Staker contract balance", async function () {
      const beforeBalance = await StakingToken.balanceOf(Staker.address);
      expect(await Staker.connect(user1).withdraw(STAKE_AMOUNT))
        .to.emit(Staker, "Withdrawn")
        .withArgs(user1.address, STAKE_AMOUNT);
      const afterBalance = await StakingToken.balanceOf(Staker.address);
      expect(beforeBalance.sub(STAKE_AMOUNT)).to.equal(afterBalance);
    });

    it("Can't withdraw if withdrawal amount is higher than stake", async () => {
      let isFail = false;
      try {
        await Staker.withdraw(MINT_AMOUNT);
      } catch (error) {
        isFail = true;
      }
      await expect(isFail).to.be.true;
    });

    it("Can't withdraw 0", async () => {
      await expect(Staker.withdraw("0")).to.be.revertedWith("Can't withdraw 0");
    });
  });

  describe("getReward()", () => {
    it("Should increase rewards token balance", async () => {
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      await Staker.connect(user1).stake(STAKE_AMOUNT);

      const block = await ethers.provider.getBlock("latest");
      const currentTimestamp = block.timestamp;
      // Move 1 day
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        currentTimestamp + day,
      ]);
      await ethers.provider.send("evm_mine");

      const initialRewardBal = await RewardToken.balanceOf(user1.address);
      await Staker.connect(user1).getReward();
      const postRewardBal = await RewardToken.balanceOf(user1.address);

      expect(postRewardBal).to.above(initialRewardBal);
    });
  });

  describe("exit()", () => {
    it("Should retrieve all earned and increase rewards bal", async () => {
      await StakingToken.connect(user1).approve(Staker.address, STAKE_AMOUNT);
      await Staker.connect(user1).stake(STAKE_AMOUNT);

      const block = await ethers.provider.getBlock("latest");
      const currentTimestamp = block.timestamp;
      // Move 1 day
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        currentTimestamp + day,
      ]);
      await ethers.provider.send("evm_mine");

      const initialRewardBal = await RewardToken.balanceOf(user1.address);
      await Staker.connect(user1).exit();
      const postRewardBal = await RewardToken.balanceOf(user1.address);

      expect(postRewardBal).to.above(initialRewardBal);
    });
  });

  describe("getRewardForDuration()", () => {
    it("Should increase rewards token balance", async () => {
      const rewardForDuration = await Staker.getRewardForDuration();

      const duration = await Staker.rewardsDuration();
      const rewardRate = await Staker.rewardRate();

      expect(rewardForDuration).to.equal(duration.mul(rewardRate));
    });
  });
});
