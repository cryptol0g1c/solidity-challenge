const RewardToken = artifacts.require("RewardToken");

const BigNumber = require("bignumber.js");
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


let rewardToken;
let owner;
let subjectA;
let anEth = 1000000000000000000;
let mintBalance = BigNumber(anEth);

contract("RewardToken", async(accounts) => {

  owner = accounts[0];
  subjectA = accounts[1];

  beforeEach(async function () {
    rewardToken = await RewardToken.new("Clogic Stake Token", "CLS", 1, 1, true);
  });

  describe('RewardToken owner', async function () {

    beforeEach(async function () { })

    it('be able to to mint tokens', async function () {
      await rewardToken.mint(subjectA, mintBalance);
      let subjectABalance = BigNumber(await rewardToken.balanceOf(subjectA));

      subjectABalance.toNumber().should.be.bignumber.equal(mintBalance);
    })

    it('be able to change the reward rates', async function () {
      let result
      let rateA = 100;
      let rateB = 200;

      await rewardToken.setRewardRates(rateA);
      result = BigNumber(await rewardToken.rewardRate())
      result.should.be.bignumber.equal(rateA);

      await rewardToken.setRewardRates(rateB);
      result = BigNumber(await rewardToken.rewardRate())
      result.should.be.bignumber.equal(rateB);

    })

    it('be able to set the withdraw fees', async function () {
      let result
      let feeA = 100;
      let feeB = 200;

      await rewardToken.setWithdrawFee(feeA);
      result = BigNumber(await rewardToken.withdrawFee())
      result.should.be.bignumber.equal(feeA);

      await rewardToken.setWithdrawFee(feeB);
      result = BigNumber(await rewardToken.withdrawFee())
      result.should.be.bignumber.equal(feeB);

    })

    it('be able to enable/disable withdraw fees', async function () {
      let result

      await rewardToken.enableWithdrawFees(true);
      result = await rewardToken.isWithdrawFeeEnable()
      result.should.be.equal(true)

      await rewardToken.enableWithdrawFees(false);
      result = await rewardToken.isWithdrawFeeEnable()
      result.should.be.equal(false)

    })

  })

  describe('RewardToken not owner', async function () {

    beforeEach(async function () { })

    it('not be able to to mint tokens', async function () {
      await rewardToken.mint(subjectA, mintBalance, {from: subjectA}).
        should.be.rejectedWith(Error, 'Ownable: caller is not the owner.');
    })

    it('not be able to change the reward rates', async function () {

      let newRewardRate = BigNumber(anEth);
      await rewardToken.setRewardRates(newRewardRate, {from: subjectA}).
        should.be.rejectedWith(Error, 'Ownable: caller is not the owner.');
    })

    it('not be able to change the withdraw Fee', async function () {
      let newWithdrawFee = BigNumber(anEth);
      await rewardToken.setWithdrawFee(newWithdrawFee, {from: subjectA}).
        should.be.rejectedWith(Error, 'Ownable: caller is not the owner.');
    })

    it('not be able to enable/disable withdraw fees', async function () {
      await rewardToken.enableWithdrawFees(true, {from: subjectA}).
        should.be.rejectedWith(Error, 'Ownable: caller is not the owner.');

      await rewardToken.enableWithdrawFees(false, {from: subjectA}).
        should.be.rejectedWith(Error, 'Ownable: caller is not the owner.');
    })

  })

});
