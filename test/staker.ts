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
  const rewardRate = parseEther("10");
  let rewardToken: RewardToken;
  let staker: Staker;
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;

  before(async () => {
    [owner, acc1] = await ethers.getSigners();
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
    it("Shouldn't allow to deposit twice", async () => {
      await staker.connect(acc1).deposit(parseEther("100"));
    });
  });
});
