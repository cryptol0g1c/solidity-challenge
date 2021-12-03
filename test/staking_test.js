const RewardToken = artifacts.require("RewardToken");
const Staker = artifacts.require("Staker");
var BigNumber = require('big-number');
require('web3');

contract("RewardToken test", async accounts => {
  it("account log", () => {
    console.log("accounts: ", accounts);
  });

  it("ether testing", async () => {
    const first_account = accounts[0];
    const second_account = accounts[1];

    // await web3.eth.sendTransaction({ from: second_account, to: first_account, value: web3.utils.toBN(web3.utils.toWei('3', 'ether'))});
    let balance = await web3.eth.getBalance(first_account);
    console.log("a1 ether: ", balance);
    balance = await web3.eth.getBalance(second_account);
    console.log("a2 ether: ", balance);
    console.log("");
  });

  it("first account distributes some of its balance to the second and the third", async () => {
    const rewardContract = await RewardToken.deployed();

    let balance = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", balance.toString());

    let bret = await rewardContract.transfer(accounts[1], new BigNumber(34e18), {from: accounts[0]});
    console.log("a1 => a2: 34RD");

    balance = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", balance.toString());
    balance = await rewardContract.balanceOf(accounts[1]);
    console.log("a2 RD: ", balance.toString());
    console.log("");

    bret = await rewardContract.transfer(accounts[2], new BigNumber(56e18), {from: accounts[0]});
    console.log("a1 => a3: 56RD");

    balance = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", balance.toString());
    balance = await rewardContract.balanceOf(accounts[1]);
    console.log("a2 RD: ", balance.toString());
    balance = await rewardContract.balanceOf(accounts[2]);
    console.log("a3 RD: ", balance.toString());
    console.log("");
  });

  it("staking reward rate test", async () => {
    const stakerContract = await Staker.deployed();

    let rval = await stakerContract.getRewardRate({from: accounts[1]});
    console.log("reward rate: ", rval.toString());

    rval = await stakerContract.owner();
    console.log("owner of staking contract is: ", rval);
    if (accounts[1] != rval)
    {
      await stakerContract.transferOwnership(accounts[1], {from: rval});
      console.log("transferred ownership to ", accounts[1]);
    }
    await stakerContract.setRewardRate(new BigNumber(30e18), {from: accounts[1]});
    console.log("changed reward rate to 30 tokens");

    rval = await stakerContract.getRewardRate({from: accounts[1]});
    console.log("reward rate: ", rval.toString());
    console.log("");
  });

  it("staking withdrawal fee test", async () => {
    const stakerContract = await Staker.deployed();

    let rval = await stakerContract.isEnabledWithdrawalFee({from: accounts[0]});
    console.log("withdrawal fee enable: ", rval.toString());

    rval = await stakerContract.owner();
    console.log("owner of staking contract is: ", rval);
    if (accounts[0] != rval)
    {
      await stakerContract.transferOwnership(accounts[0], {from: rval});
      console.log("transferred ownership to ", accounts[0]);
    }
    await stakerContract.enableWidthdrawalFee(true, {from: accounts[0]});
    console.log("changed withdrawal fee enable to true");

    rval = await stakerContract.isEnabledWithdrawalFee({from: accounts[0]});
    console.log("withdrawal fee enable: ", rval.toString());
    console.log("");

    rval = await stakerContract.getWithdrawalFeeRate({from: accounts[0]});
    console.log("withdrawal fee rate: ", rval.toString());

    await stakerContract.setWithdrawalFeeRate(500, {from: accounts[0]});
    console.log("set withdrawal fee rate to 5%");

    rval = await stakerContract.getWithdrawalFeeRate({from: accounts[0]});
    console.log("withdrawal fee rate: ", rval.toString());
    console.log("");
  });

  it("staking deposit/withdraw + reward", async () => {
    const rewardContract = await RewardToken.deployed();
    const stakerContract = await Staker.deployed();

    let stakerAddress = await stakerContract.address;
    console.log("staker contract address: ", stakerAddress);

    let rewardAddress = await rewardContract.address;
    console.log("reward token contract address: ", rewardAddress);

    rewardContract.transferOwnership(stakerAddress, {from: accounts[0]});

    let rval = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", rval.toString());

    rval = await web3.eth.getBlock("latest");
    console.log("block gas limit: ", rval.gasLimit);
    let gaslimit = rval.gasLimit;

    console.log("");

    await rewardContract.approve(stakerAddress, new BigNumber(10e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 approved staker contract for 10 RD");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    await stakerContract.deposit(new BigNumber(10e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 staked 10 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");

    await rewardContract.approve(stakerAddress, new BigNumber(15e18), {from: accounts[1], gas: gaslimit});
    console.log("a2 approved staker contract for 15 RD");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    await stakerContract.deposit(new BigNumber(15e18), {from: accounts[1], gas: gaslimit});
    console.log("a2 staked 15 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[1]);
    console.log("a2 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");

    await rewardContract.approve(stakerAddress, new BigNumber(8e18), {from: accounts[2], gas: gaslimit});
    console.log("a3 approved staker contract for 8 RD");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    await stakerContract.deposit(new BigNumber(8e18), {from: accounts[2], gas: gaslimit});
    console.log("a3 staked 8 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[2]);
    console.log("a3 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");

    await rewardContract.approve(stakerAddress, new BigNumber(33e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 approved staker contract for 33 RD");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    await stakerContract.deposit(new BigNumber(33e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 staked 33 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");

    await stakerContract.withdraw(new BigNumber(17e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 withdrew 17 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");

    await stakerContract.withdraw(new BigNumber(20e18), {from: accounts[0], gas: gaslimit});
    console.log("a1 withdrew 20 tokens");

    rval = await stakerContract.getAccTok({from: accounts[0]});
    console.log("acc: ", rval.toString());

    rval = await rewardContract.balanceOf(accounts[0]);
    console.log("a1 RD: ", rval.toString());
    rval = await rewardContract.balanceOf(stakerAddress);
    console.log("staker RD: ", rval.toString());
    console.log("");
  });

  // it("should call a function that depends on a linked library", async () => {
  //   const meta = await RewardToken.deployed();
  //   const outCoinBalance = await meta.getBalance.call(accounts[0]);
  //   const metaCoinBalance = outCoinBalance.toNumber();
  //   const outCoinBalanceEth = await meta.getBalanceInEth.call(accounts[0]);
  //   const metaCoinEthBalance = outCoinBalanceEth.toNumber();
  //   assert.equal(metaCoinEthBalance, 2 * metaCoinBalance);
  // });

  // it("should send coin correctly", async () => {
  //   // Get initial balances of first and second account.
  //   const account_one = accounts[0];
  //   const account_two = accounts[1];

  //   const amount = 10;

  //   const rewardContract = await RewardToken.deployed();
  //   const meta = rewardContract;

  //   const balance = await meta.getBalance.call(account_one);
  //   const account_one_starting_balance = balance.toNumber();

  //   balance = await meta.getBalance.call(account_two);
  //   const account_two_starting_balance = balance.toNumber();
  //   await meta.sendCoin(account_two, amount, { from: account_one });

  //   balance = await meta.getBalance.call(account_one);
  //   const account_one_ending_balance = balance.toNumber();

  //   balance = await meta.getBalance.call(account_two);
  //   const account_two_ending_balance = balance.toNumber();

  //   assert.equal(
  //     account_one_ending_balance,
  //     account_one_starting_balance - amount,
  //     "Amount wasn't correctly taken from the sender"
  //   );
  //   assert.equal(
  //     account_two_ending_balance,
  //     account_two_starting_balance + amount,
  //     "Amount wasn't correctly sent to the receiver"
  //   );
  // });
});