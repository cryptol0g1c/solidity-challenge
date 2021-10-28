const Staking = artifacts.require("Staking");
const Mt0Token = artifacts.require("Mt0Token");
const Mt1Token = artifacts.require("Mt1Token");

contract("Staking...", async (accounts) => {
    let [alice] = accounts;
    let contractInstance;
    let tokenInstance0;
    let tokenInstance1;
    beforeEach(async () => {
        tokenInstance0 = await Mt0Token.new();
        tokenInstance1 = await Mt1Token.new();
        contractInstance = await Staking.new(tokenInstance0.address, tokenInstance1.address);
    });
    it("should be able to change rewardRate", async () => {
        const result = await contractInstance.setRewardRate(50, {from: alice});
        //TODO: replace with expect
        assert.equal(result.receipt.status, true);
        assert.equal((await contractInstance.getRewardRate()).toString(), '50');
    });
    it("should be able to change withdrawFee", async () => {
        const result = await contractInstance.setWithdrawFee(5, {from: alice});
        //TODO: replace with expect
        assert.equal(result.receipt.status, true);
        assert.equal((await contractInstance.getWithdrawFee()).toString(), '5');
    });
    it("should be able to change withdrawFeeStatus", async () => {
        const result = await contractInstance.setWithdrawFeeStatus(false, {from: alice});
        //TODO: replace with expect
        assert.equal(result.receipt.status, true);
        assert.equal((await contractInstance.getWithdrawFeeStatus()), false);
    });
    it("should be able to stake", async () => {
        const before = await contractInstance.getBalanceOf({from: alice});

        tokenInstance0.approve(contractInstance.address, 100000000000, {from: alice, gas:3000000});
        const result = await contractInstance.stake(1000000, {from: alice, gas:3000000});
        const after = await contractInstance.getBalanceOf({from: alice});
        //TODO: replace with expect
        assert.equal(result.receipt.status, true);
        assert.equal(after - before, 1000000);
    });
    it("should be able to withdraw", async () => {
        tokenInstance0.approve(contractInstance.address, 100000000000, {from: alice, gas:3000000});
        const result = await contractInstance.stake(1000000, {from: alice, gas:3000000});
        assert.equal(result.receipt.status, true);
        const before = await contractInstance.getBalanceOf({from: alice});
        const result1 = await contractInstance.withdraw(1000000, {from: alice, gas:3000000});
        const after = await contractInstance.getBalanceOf({from: alice});
        //TODO: replace with expect
        assert.equal(result1.receipt.status, true);
        assert.equal(before - after, 900000);
    });
    it("should be able to claimReward", async () => {
        const result = await contractInstance.claimReward({from: alice});
        const rewards = await contractInstance.getBalanceOf({from: alice});
        //TODO: replace with expect
        assert.equal(result.receipt.status, true);
        assert.equal(rewards, 0);
    });
})
