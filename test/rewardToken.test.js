const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.utils.parseEther;
const BN = ethers.BigNumber;

describe("RewardToken", () => {
  let owner, acc1;
  let RewardToken;
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
  const newWithdrawalFee = 800;
  const newRewardRate = parseEther("0.01");
  const newIsWithdrawalFeeEnabled = true;
  const ownerError = "Ownable: caller is not the owner";

  before(async () => {
    RewardToken = await ethers.getContractFactory("RewardToken");
    [owner, acc1] = await ethers.getSigners();
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
    it("Reject deploy with withdrawalFee 0", async () => {
      expect(
        RewardToken.deploy(
          rewardTokenProps.name,
          rewardTokenProps.symbol,
          rewardTokenProps.isWithdrawalFeeEnabled,
          0,
          rewardTokenProps.rewardRate
        )
      ).to.be.reverted;
    });

    it("Reject deploy with withdrawalFee greater than maxWithdrawalFee", async () => {
      expect(
        RewardToken.deploy(
          rewardTokenProps.name,
          rewardTokenProps.symbol,
          rewardTokenProps.isWithdrawalFeeEnabled,
          1001,
          rewardTokenProps.rewardRate
        )
      ).to.be.reverted;
    });

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
      it("Mint reject non owner accounts", async () => {
        await expect(
          rewardToken.connect(acc1).mint(acc1.address, parseEther("100"))
        ).to.be.revertedWith(ownerError);
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

    describe("withdrawalFee", () => {
      it("setWithdrawalFee reject non owner accounts", async () => {
        await expect(
          rewardToken.connect(acc1).setWithdrawalFee(newWithdrawalFee)
        ).to.be.revertedWith(ownerError);
      });

      it("Reject withdrawalFee 0", async () => {
        await expect(rewardToken.setWithdrawalFee(0)).to.be.revertedWith(
          "withdrawalFee can't be 0. Maybe you want to call setIsWithdrawalFeeEnabled with false"
        );
      });

      it("Reject withdrawalFee greater than maxWithdrawalFee", async () => {
        await expect(rewardToken.setWithdrawalFee(1001)).to.be.revertedWith(
          "withdrawalFee can't be greater than 1000"
        );
      });

      it("Update withdrawalFee and emit event", async () => {
        await expect(rewardToken.setWithdrawalFee(newWithdrawalFee))
          .to.emit(rewardToken, "WithdrawalFeeUpdated")
          .withArgs(newWithdrawalFee);
        rewardTokenProps.withdrawalFee = newWithdrawalFee;
        expect(await rewardToken.withdrawalFee()).to.eq(
          rewardTokenProps.withdrawalFee
        );
      });

      it("setIsWithdrawalFeeEnabled reject non owner accounts", async () => {
        await expect(
          rewardToken.connect(acc1).setIsWithdrawalFeeEnabled(false)
        ).to.be.revertedWith(ownerError);
      });

      it("Reject setIsWithdrawalFeeEnabled with no changes", async () => {
        await expect(
          rewardToken.setIsWithdrawalFeeEnabled(
            await rewardToken.isWithdrawalFeeEnabled()
          )
        ).to.be.revertedWith(
          "isWithdrawalFeeEnabled already has the valor sent"
        );
      });

      it("Update isWithdrawalFeeEnabled and emit event", async () => {
        await expect(
          rewardToken.setIsWithdrawalFeeEnabled(newIsWithdrawalFeeEnabled)
        )
          .to.emit(rewardToken, "WithdrawalFeeToggled")
          .withArgs(newIsWithdrawalFeeEnabled);
        rewardTokenProps.isWithdrawalFeeEnabled = newIsWithdrawalFeeEnabled;
        expect(await rewardToken.isWithdrawalFeeEnabled()).to.eq(
          rewardTokenProps.isWithdrawalFeeEnabled
        );
      });

      describe("rewardRate", () => {
        it("setRewardRate reject non owner accounts", async () => {
          await expect(
            rewardToken.connect(acc1).setRewardRate(parseEther("100"))
          ).to.be.revertedWith(ownerError);
        });

        it("Update rewardRate and emit event", async () => {
          await expect(rewardToken.setRewardRate(newRewardRate))
            .to.emit(rewardToken, "RewardRateUpdated")
            .withArgs(newRewardRate);
          rewardTokenProps.rewardRate = newRewardRate;
          expect(await rewardToken.rewardRate()).to.eq(
            rewardTokenProps.rewardRate
          );
        });
      });
    });
  });

  describe("User functions", () => {
    it("Reject transfer if amount exceeds balance", async () => {
      await expect(
        rewardToken
          .connect(acc1)
          .transfer(owner.address, rewardTokenProps.totalSupply.add(1))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Transfer from acc1 to owner", async () => {
      await rewardToken
        .connect(acc1)
        .transfer(owner.address, rewardTokenProps.totalSupply);
      expect(await rewardToken.balanceOf(acc1.address)).to.eq(0);
      expect(await rewardToken.balanceOf(owner.address)).to.eq(
        rewardTokenProps.totalSupply
      );
    });
  });
});
