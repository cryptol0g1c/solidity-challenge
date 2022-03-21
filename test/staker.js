const Staker = artifacts.require("Staker");
const RewardToken = artifacts.require("RewardToken");

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { time } = require('@openzeppelin/test-helpers');

const BigNumber = require("bignumber.js");
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()


let rewardToken;
let staker
let owner;
let subjectA;
let subjectB;
let subjectC;
let anEth = 1000000000000000000;

async function jumpBlocks(blockLeap) {
  currentBlock = await web3.eth.getBlockNumber();
  await time.advanceBlockTo(currentBlock + blockLeap);
}

contract("Staker", function (accounts, deployer) {
  owner = accounts[0];
  subjectA = accounts[1];
  subjectB = accounts[2];
  subjectC = accounts[3];

  beforeEach(async function () {
    rewardToken = await RewardToken.new("Clogic Stake Token", "CLS", 10, 100, false);

    const instance = await deployProxy(Staker, [rewardToken.address], { deployer });
    staker = await upgradeProxy(instance.address, Staker, { deployer });

    rewardToken.mint(staker.address, 6000);

  });

  it('be able to deposit a token amount', async function () {

    let stakeAmount = 1000;
    await rewardToken.mint(subjectA, stakeAmount);
    await rewardToken.approve(staker.address, stakeAmount, {from: subjectA});

    let tx = await staker.deposit(stakeAmount, {from: subjectA});
    let stakedBlock = tx.receipt.blockNumber
    let stakedAmount = BigNumber(await staker.stakeAmount(subjectA))
    let stakedTime = BigNumber(await staker.stakeTime(subjectA))
    let totalStaked = BigNumber(await staker.totalStaked())

    stakedAmount.should.be.bignumber.equal(stakeAmount);
    stakedTime.should.be.bignumber.equal(stakedBlock);
    stakedAmount.should.be.bignumber.equal(totalStaked);

  })

  describe('withdraws', async function () {

    beforeEach(async function () {

      let stakeAmount = 1000;
      await rewardToken.mint(subjectA, stakeAmount);
      await rewardToken.approve(staker.address, stakeAmount, {from: subjectA});

      await staker.deposit(stakeAmount, {from: subjectA});

    });

    it('not increase rewards for users without stakes', async function () {
      await jumpBlocks(10);

      let reward1 = BigNumber(await staker.calculateRewards(subjectC));

      reward1.should.be.bignumber.equal(0);
    });

    it('user should accumulate more of the tokens with time', async function () {
      await jumpBlocks(10);

      let reward1 = BigNumber(await staker.calculateRewards(subjectA));

      await jumpBlocks(5);

      let reward2 = BigNumber(await staker.calculateRewards(subjectA));

      reward1.should.be.bignumber.equal(100);
      reward2.should.be.bignumber.equal(150);
    });

    it('charge withdrawFee if enabled', async function () {
      await jumpBlocks(10);
      await rewardToken.enableWithdrawFees(true);
      await staker.withdraw({from:subjectA});
      let balance = BigNumber(await rewardToken.balanceOf(subjectA));
      balance.should.be.bignumber.equal(1020);
    })

    it('not charge withdrawFee if disalbed', async function () {
      await jumpBlocks(10);
      await rewardToken.enableWithdrawFees(false);
      await staker.withdraw({from:subjectA});
      let balance = BigNumber(await rewardToken.balanceOf(subjectA));
      balance.should.be.bignumber.equal(1120);
    })

    it('should get the proportional share of the rewards.', async function () {
      let stakeAmount = 10000;

      await rewardToken.mint(subjectB, stakeAmount);
      await rewardToken.approve(staker.address, stakeAmount, {from: subjectB});
      await staker.deposit(stakeAmount, {from: subjectB});

      await jumpBlocks(10);

      let rewardA = BigNumber(await staker.calculateRewards(subjectA));
      let rewardB = BigNumber(await staker.calculateRewards(subjectB));

      rewardA.should.be.bignumber.equal(11);
      rewardB.should.be.bignumber.equal(90);

    })

  })




});
