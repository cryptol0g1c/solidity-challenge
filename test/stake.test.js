'use strict';

var RewardToken = artifacts.require("RewardToken");
var Staker = artifacts.require("Staker");
const truffleAssert = require('truffle-assertions');

let token;
let staker;

contract('Staking contract tests', (accounts) => {
    before(async () => {
        accounts = await web3.eth.getAccounts();
        token = await RewardToken.deployed();
        staker = await Staker.deployed();
    });

    it(`Scenario 1: should set Owner as account[0]`, async () => {
        let owner = await staker.owner();
        console.log(owner)
        console.log(accounts)
        assert.equal(owner, accounts[0], "Wrong owner set");
    });

    it('Scenario 2:Should not allow to stake when approval from ERC20 is not done', async () => {
        await truffleAssert.reverts(
            staker.deposit(1000),
            "User did not approve the tokens"
        );
    });

    it('Scenario 3:Should not allow to stake when approval from ERC20 is less than staking amount', async () => {
        await token.approve(staker.address, 100)
        await truffleAssert.reverts(
            staker.deposit(1000),
            "Approved amount less than staking amount"
        );
    });

    it('Scenario 4:Should allow to stake when approval from ERC20 is equal to or more than staking amount', async () => {
        var transferAmount = web3.utils.toWei(web3.utils.toBN(2000), "ether");
        await token.transfer(accounts[1], transferAmount)
        await token.approve(staker.address, transferAmount, { from: accounts[1] })
        await staker.deposit(transferAmount, { from: accounts[1] });
        assert(true);
    });

    it('Scenario 6:Should allow admin to call method calculateRewards', async () => {
        await staker.calculateRewards();
        let user = await staker.stakerDetails(accounts[1]);
        assert(true);
    });

    it('Scenario 7:Should not allow user to stake when already staked', async () => {
        var transferAmount = web3.utils.toWei(web3.utils.toBN(1000, "ether"));
        await token.approve(staker.address, transferAmount)
        await truffleAssert.reverts(
            staker.deposit(transferAmount, { from: accounts[1] }),
            "User Already staked"
        );
    });

    it('Scenario 8:Should not allow non-admin to call method calculateRewards', async () => {
        await truffleAssert.reverts(staker.calculateRewards({ from: accounts[2] }))
    });

    it('Scenario 9:Should allow admin to call method calculateRewards', async () => {
        await staker.calculateRewards();
        let user = await staker.stakerDetails(accounts[1]);
        assert(true);
    });

    it('Scenario 10:Should stake when deposited by another user', async () => {
        var transferAmount = web3.utils.toWei(web3.utils.toBN(1000, "ether"));
        await token.transfer(accounts[2], transferAmount)
        await token.approve(staker.address, transferAmount, { from: accounts[2] })

        await token.transfer(accounts[3], transferAmount)
        await token.approve(staker.address, transferAmount, { from: accounts[3] })
        await token.transfer(accounts[4], transferAmount)
        await token.approve(staker.address, transferAmount, { from: accounts[4] })
        await token.transfer(accounts[5], transferAmount)
        await token.approve(staker.address, transferAmount, { from: accounts[5] })

        await staker.deposit(transferAmount, { from: accounts[2] });
        await staker.deposit(transferAmount, { from: accounts[3] });
        await staker.deposit(transferAmount, { from: accounts[4] });
        await staker.deposit(transferAmount, { from: accounts[5] });
        assert(true);
    });

    it('Scenario 11:Should not allow non-staker to wtihdraw', async () => {
        await truffleAssert.reverts(staker.withdraw({ from: accounts[0] }))
    });

    it('Scenario 12:Should allow staker to wtihdraw & recalculate Rewards', async () => {
        var transferAmount = web3.utils.toWei(web3.utils.toBN(1000, "ether"));
        var balanceBefore =await token.balanceOf(accounts[5]);
        await staker.withdraw({ from: accounts[5] })
        var balanceAfter =await token.balanceOf(accounts[5]);
        console.log(web3.utils.fromWei(""+balanceAfter, "ether"));
        assert(BigInt(balanceBefore) <= BigInt(balanceAfter), "Invalid Balance after withdraw")
        await staker.calculateRewards();
        assert(true)
    });

    it('Scenario 13:Should not allow non-admin to set rewardrate / enable/disable withdraw fee & setwithdraw fee', async () => {
        await truffleAssert.reverts(token.setRewardRate(200,{ from: accounts[2] }))
        await truffleAssert.reverts(token.disableWithdrawFee({ from: accounts[2] }))
        await truffleAssert.reverts(token.enableWithdrawFee({ from: accounts[2] }))
        await truffleAssert.reverts(token.setWithdrawFee(1,{ from: accounts[2] }))
    });

    it('Scenario 14:Should allow admin to set rewardrate / enable/disable withdraw fee & setwithdraw fee with valid & invalid values', async () => {
        await truffleAssert.reverts(token.setRewardRate(0))
        await token.setRewardRate(200)
        await token.disableWithdrawFee()
        await token.enableWithdrawFee()
        await token.setWithdrawFee(1)
        assert(true)
    });

    it('Scenario 15:Should allow staker to wtihdraw with modified fee', async () => {
        var balanceBefore =await token.balanceOf(accounts[1]);
        await staker.withdraw({ from: accounts[1] })
        var balanceAfter =await token.balanceOf(accounts[1]);
        console.log(web3.utils.fromWei(""+balanceAfter, "ether"));
        assert(BigInt(balanceBefore) <= BigInt(balanceAfter), "Invalid Balance after withdraw")
    });

});