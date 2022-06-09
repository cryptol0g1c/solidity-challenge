const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.utils.parseEther;
const BN = ethers.BigNumber;
const provider = ethers.provider;

describe("Staker", () => {
  let owner;
  let users = new Array(2);
  let rewardTokenProps = {
    address: undefined,
    name: "RewardToken",
    symbol: "RTK",
    withdrawalFee: 400, // 4%
    isWithdrawalFeeEnabled: false,
    rewardRate: parseEther("0.001"),
    owner: undefined,
    totalSupply: BN.from(0),
  };
  let rewardToken;
  let staker;
  const newWithdrawalFee = 800;
  const newRewardRate = parseEther("0.01");
  const newIsWithdrawalFeeEnabled = true;
  const ownerError = "Ownable: caller is not the owner";
  let startBlock = 1000;
  const tokensToStaker = parseEther("1000");
  const tokensPerUser = [50, 30].map((amount) => parseEther(amount.toString()));

  before(async () => {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    [owner, users[0], users[1]] = await ethers.getSigners();
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
    const latestBlock = await provider.getBlock("latest");
    startBlock += latestBlock.number;
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
        await rewardToken.mint(users[i].address, tokensPerUser[i]);
        expect(await rewardToken.balanceOf(users[i].address)).to.be.eq(
          tokensPerUser[i]
        );
      }
      rewardTokenProps.totalSupply = tokensPerUser.reduce((a, b) => {
        return a.add(b);
      });
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
  });
});
