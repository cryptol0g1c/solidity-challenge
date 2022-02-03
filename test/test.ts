import {expect} from "chai";
import {RewardToken, Staker, TestToken1, TestToken2} from "../typechain";
import {ethers} from "hardhat";
import { BigNumber } from "ethers";
import { toBn } from "evm-bn";
import exp from "constants";

describe("End to End tests", function () {
    let token;
    let rewardToken: RewardToken;
    let staker: Staker;
    let testToken1: TestToken1;
    let testToken2: TestToken2;
    let owner: any;
    let addr1: any;
    let addr2: any;
    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        token = await ethers.getContractFactory("RewardToken");
        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens once its transaction has been
        // mined.
        rewardToken = await token.deploy();
        await rewardToken.initialize();
        token = await ethers.getContractFactory("Staker");
        staker = await token.deploy();
        await staker.initialize(rewardToken.address);

        token = await ethers.getContractFactory("TestToken1");
        testToken1 = await token.deploy();

        token = await ethers.getContractFactory("TestToken2");
        testToken2 = await token.deploy();

        [owner, addr1, addr2] = await ethers.getSigners();
    });

    it("should pass end to end tests", async () => {
        // Test for genesis token supply
        const initialSupply = await rewardToken.totalSupply();
        expect(initialSupply).to.equal(toBn("1000"));

        // Test for admin permission
        await expect(rewardToken.mint(addr1.address, 100)).to.be.revertedWith("Only admins can mint");

        // Add admin
        rewardToken.addAdmin(owner.address);

        // Mint 5000000 tokens to Staker contract
        await rewardToken.mint(staker.address, 5000000);
        // Mint 100 tokens to addr1 and addr2
        await rewardToken.mint(addr1.address, 100);
        await rewardToken.mint(addr2.address, 100);
        const addr1Value = await rewardToken.balanceOf(addr1.address)
        expect(addr1Value).to.equal(BigNumber.from(100));

        // Set withdraw fee
        await rewardToken.setWithdrawFeeEnabled(true);
        await rewardToken.setRewardRate(testToken1.address, 100);
        await rewardToken.setRewardRate(testToken2.address, 200);
        await rewardToken.setWithdrawFee(10);
        expect(await rewardToken.getRewardRate(testToken1.address)).to.equal(BigNumber.from(100));
        expect(await rewardToken.getRewardRate(testToken2.address)).to.equal(BigNumber.from(200));

        // Mint 2000 number testToken1 and testToken2 to addr1 and addr2
        await testToken1.mint(addr1.address, 2000);
        console.log("============", await testToken1.balanceOf(addr1.address));
        await testToken2.mint(addr2.address, 2000);
        // Stake 1000 number of testToken1 and testToken2
        await testToken1.connect(addr1).approve(staker.address, 1000000);
        await staker.connect(addr1).stake(testToken1.address, 1000);
        await testToken2.connect(addr2).approve(staker.address, 1000000);
        await staker.connect(addr2).stake(testToken2.address, 1000);
        // Increase 1 day
        await ethers.provider.send('evm_increaseTime', [1 * 24 * 60 * 60]);
        await ethers.provider.send('evm_mine', []);
        const totalRewardAddr1 = await staker.getTotalReward(testToken1.address, addr1.address);
        const totalRewardAddr2 = await staker.getTotalReward(testToken2.address, addr2.address);
        expect(totalRewardAddr1).to.equal(BigNumber.from(1 / 1 * 1000 * 100));
        expect(totalRewardAddr2).to.equal(BigNumber.from(1 / 1 * 1000 * 200));

        // withdraw
        await staker.connect(addr1).withdrawReward(testToken1.address, 0);
        const receivedRewardAmountAddr1 = await rewardToken.balanceOf(addr1.address);
        expect(receivedRewardAmountAddr1).to.equal(BigNumber.from(100 + 1 / 1 * 1000 * 100 * (100 - 10)/100));
    })
});
