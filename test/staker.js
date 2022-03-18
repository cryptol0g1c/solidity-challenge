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
let anEth = 1000000000000000000;

contract("Staker", function (accounts, deployer) {
  owner = accounts[0];
  subjectA = accounts[1];

  beforeEach(async function () {
    rewardToken = await RewardToken.new("Clogic Stake Token", "CLS", 1, 1, false);

    const instance = await deployProxy(Staker, [rewardToken.address], { deployer });
    staker = await upgradeProxy(instance.address, Staker, { deployer });

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

  it('be able to withdraw a token amount', async function () {

    let stakeAmount = 1000;
    await rewardToken.mint(subjectA, stakeAmount);
    await rewardToken.approve(staker.address, stakeAmount, {from: subjectA});
    await staker.deposit(stakeAmount, {from: subjectA});
    await staker.withdraw({from: subjectA});



    let stakedBlock = tx.receipt.blockNumber
    let stakedAmount = BigNumber(await staker.stakeAmount(subjectA))
    let stakedTime = BigNumber(await staker.stakeTime(subjectA))
    let totalStaked = BigNumber(await staker.totalStaked())

    stakedAmount.should.be.bignumber.equal(stakeAmount);
    stakedTime.should.be.bignumber.equal(stakedBlock);
    stakedAmount.should.be.bignumber.equal(totalStaked);

  })




});
