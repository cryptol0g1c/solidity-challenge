const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.utils.parseEther;
const hexValue = ethers.utils.hexValue;
const BN = ethers.BigNumber;
const provider = ethers.provider;

async function getBlockNumber() {
  return (await provider.getBlock("latest")).number;
}

describe("Staker", () => {
  const BASIS_POINTS = BN.from(10000);
  const STAKER_SHARE_PRECISION = parseEther("1");
  let owner;
  let users = new Array(4);
  let rewardTokenProps = {
    address: undefined,
    name: "RewardToken",
    symbol: "RTK",
    withdrawalFee: 400, // 4%
    isWithdrawalFeeEnabled: true,
    rewardRate: parseEther("0.001"),
    owner: undefined,
    totalSupply: BN.from(0),
  };
  let rewardToken;
  let staker;
  const newWithdrawalFee = 800;
  const newRewardRate = parseEther("0.01");
  const newIsWithdrawalFeeEnabled = true;
  let startBlock = 1000;
  const tokensToStaker = parseEther("1000");
  const tokensPerUser = [50, 30, 120, 200].map((amount) =>
    parseEther(amount.toString())
  );
  const totalTokenToUsers = tokensPerUser.reduce((a, b) => {
    return a.add(b);
  });

  async function getPending(user) {
    await staker.updateStaking();
    const accRewardTokenPerShare = await staker.accRewardTokenPerShare();
    const rewardRate = await rewardToken.rewardRate();
    const totalStaked = await staker.totalStaked();
    const userInfo = await staker.userInfo(user);
    const pending = userInfo.amount
      .mul(
        accRewardTokenPerShare.add(
          BN.from(1)
            .mul(rewardRate)
            .mul(STAKER_SHARE_PRECISION)
            .div(totalStaked)
        )
      )
      .div(STAKER_SHARE_PRECISION)
      .sub(userInfo.rewardDebt);

    return pending;
  }

  before(async () => {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    [owner, users[0], users[1], users[2], users[3]] = await ethers.getSigners();
    rewardToken = await RewardToken.deploy(
      rewardTokenProps.name,
      rewardTokenProps.symbol,
      rewardTokenProps.isWithdrawalFeeEnabled,
      rewardTokenProps.withdrawalFee,
      rewardTokenProps.rewardRate
    );
    await rewardToken.deployed();
    rewardTokenProps.address = rewardToken.address;
    rewardTokenProps.owner = owner.address;

    const Staker = await ethers.getContractFactory("Staker");
    startBlock += await getBlockNumber();
    staker = await Staker.deploy(rewardToken.address, startBlock);
  });

  describe("Deployment", () => {
    it("Check deploy arguments", async () => {
      expect(await staker.rewardToken()).to.eq(rewardTokenProps.address);
      expect(await staker.lastRewardBlock()).to.eq(startBlock);
    });
  });

  describe("Distribute tokens", () => {
    it("Mint tokens to users", async () => {
      for (let i = 0; i < users.length; i++) {
        let tokensToUser = tokensPerUser[i];
        let user = users[i];
        await rewardToken.mint(user.address, tokensToUser);
        expect(await rewardToken.balanceOf(user.address)).to.be.eq(
          tokensToUser
        );
      }
      rewardTokenProps.totalSupply = totalTokenToUsers;
      expect(await rewardToken.totalSupply()).to.be.eq(
        rewardTokenProps.totalSupply
      );
    });

    it("Mint tokens to staker", async () => {
      await rewardToken.mint(staker.address, tokensToStaker);
      rewardTokenProps.totalSupply =
        rewardTokenProps.totalSupply.add(tokensToStaker);
      expect(await rewardToken.totalSupply()).to.be.eq(
        rewardTokenProps.totalSupply
      );
    });

    it("Approve staker transfer users tokens", async () => {
      for (let i = 0; i < users.length; i++) {
        let tokensToUser = tokensPerUser[i];
        let user = users[i];
        await rewardToken.connect(user).approve(staker.address, tokensToUser);
        expect(
          await rewardToken.allowance(user.address, staker.address)
        ).to.be.eq(tokensToUser);
      }
    });
  });

  describe("Staker functions", () => {
    it("Reject deposit 0", async () => {
      await expect(staker.deposit(0)).to.be.revertedWith(
        "Can't deposit 0 tokens"
      );
    });

    it("Users deposit tokens and emit event", async () => {
      for (let i = 0; i < users.length; i++) {
        let tokensToUser = tokensPerUser[i];
        let user = users[i];
        await expect(staker.connect(user).deposit(tokensToUser))
          .to.emit(staker, "Deposit")
          .withArgs(user.address, tokensToUser);
        expect(await rewardToken.balanceOf(user.address)).to.be.eq(0);
        let userInfo = await staker.userInfo(user.address);
        expect(userInfo.amount).to.be.eq(tokensToUser);
        expect(userInfo.rewardDebt).to.be.eq(0);
      }
      expect(await rewardToken.balanceOf(staker.address)).to.be.eq(
        rewardTokenProps.totalSupply
      );
      expect(await staker.totalStaked()).to.be.eq(totalTokenToUsers);
    });

    it("Rewards shouldn't be started", async () => {
      expect(await staker.lastRewardBlock()).to.be.gt(await getBlockNumber());
    });

    it("Start rewards distributions", async () => {
      const remainingBlocks = startBlock - (await getBlockNumber());
      await provider.send("hardhat_mine", [hexValue(remainingBlocks + 1)]);
      expect(await staker.lastRewardBlock()).to.be.lt(await getBlockNumber());
      expect(await staker.accRewardTokenPerShare()).to.be.eq(0);
    });

    it("UpdateStaking", async () => {
      const blockBefore = await staker.lastRewardBlock();
      await staker.updateStaking();
      const blockAfter = await getBlockNumber();
      expect(await staker.lastRewardBlock()).to.be.eq(blockAfter);
      expect(await staker.accRewardTokenPerShare()).to.be.eq(
        BN.from(blockAfter)
          .sub(blockBefore)
          .mul(await rewardToken.rewardRate())
          .mul(STAKER_SHARE_PRECISION)
          .div(await staker.totalStaked())
      );
    });

    it("Check pending rewards", async () => {
      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        const pending = await staker.getPending(user.address);
        const debt = await staker.getUserDebt(user.address);
        expect(pending).to.be.eq(
          debt.sub((await staker.userInfo(user.address)).rewardDebt)
        );
      }
    });

    it("User0 withdraw with fee", async () => {
      const user = users[0];
      const userTokensStaked = tokensPerUser[0];
      const pending = await getPending(user.address);
      const stakerBalanceBefore = await rewardToken.balanceOf(staker.address);
      await staker.connect(user).withdraw();
      const stakerBalanceAfter = await rewardToken.balanceOf(staker.address);
      const userInfo = await staker.userInfo(user.address);
      expect(userInfo.amount).to.be.eq(0);
      expect(userInfo.rewardDebt).to.be.eq(0);
      const devFee = userTokensStaked
        .add(pending)
        .mul(await rewardToken.withdrawalFee())
        .div(BASIS_POINTS);
      expect(await rewardToken.balanceOf(user.address)).to.be.eq(
        userTokensStaked.add(pending).sub(devFee)
      );
      expect(stakerBalanceAfter).to.be.eq(
        stakerBalanceBefore.sub(userTokensStaked.add(pending))
      );
      expect(await rewardToken.balanceOf(owner.address)).to.be.eq(devFee);
    });

    it("User1 withdraw without fee", async () => {
      await rewardToken.setIsWithdrawalFeeEnabled(false);
      const user = users[1];
      const userTokensStaked = tokensPerUser[1];
      const pending = await getPending(user.address);
      const ownerBalanceBefore = await rewardToken.balanceOf(owner.address);
      const stakerBalanceBefore = await rewardToken.balanceOf(staker.address);
      await staker.connect(user).withdraw();
      const stakerBalanceAfter = await rewardToken.balanceOf(staker.address);
      const userInfo = await staker.userInfo(user.address);
      expect(userInfo.amount).to.be.eq(0);
      expect(userInfo.rewardDebt).to.be.eq(0);
      expect(await rewardToken.balanceOf(user.address)).to.be.eq(
        userTokensStaked.add(pending)
      );
      expect(stakerBalanceAfter).to.be.eq(
        stakerBalanceBefore.sub(userTokensStaked.add(pending))
      );
      expect(await rewardToken.balanceOf(owner.address)).to.be.eq(
        ownerBalanceBefore
      );
    });
  });
});
