const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.utils.parseEther;
const BN = ethers.BigNumber;

describe("RewardToken", () => {
  let owner, acc1;
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

  before(async () => {
    [owner, acc1] = await ethers.getSigners();
    const RewardToken = await ethers.getContractFactory("RewardToken");
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
  });

  describe("Deployment", () => {
    it("Check deploy arguments", async () => {
      expect(await rewardToken.name()).to.eq(rewardTokenProps.name);
      expect(await rewardToken.symbol()).to.eq(rewardTokenProps.symbol);
      expect(await rewardToken.withdrawalFee()).to.eq(
        rewardTokenProps.withdrawalFee
      );
      expect(await rewardToken.isWithdrawalFeeEnabled()).to.eq(
        rewardTokenProps.isWithdrawalFeeEnabled
      );
      expect(await rewardToken.rewardRate()).to.eq(rewardTokenProps.rewardRate);
    });

    it("Check owner", async () => {
      expect(await rewardToken.owner()).to.eq(rewardTokenProps.owner);
    });

    it("Shouldn't have minted tokens", async () => {
      expect(await rewardToken.totalSupply()).to.eq(
        rewardTokenProps.totalSupply
      );
    });
  });

  describe("Owner functions", () => {
    describe("Mint", () => {
      it("Reject non owner accounts", async () => {
        await expect(
          rewardToken.connect(acc1).mint(acc1.address, parseEther("100"))
        ).to.be.reverted;
      });

      it("Mint to acc1", async () => {
        const mintAmount = parseEther("100");
        await rewardToken.mint(acc1.address, mintAmount);
        rewardTokenProps.totalSupply =
          rewardTokenProps.totalSupply.add(mintAmount);
        const balance = await rewardToken.balanceOf(acc1.address);
        const totalSupply = await rewardToken.totalSupply();
        expect(balance).to.eq(mintAmount);
        expect(totalSupply).to.eq(mintAmount);
        expect(totalSupply).to.eq(rewardTokenProps.totalSupply);
      });
    });
  });
});
