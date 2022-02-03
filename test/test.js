const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { BigNumber } = require("ethers");

async function mintForAddress(token, address, amount) {
  const formatAmount = ethers.utils.parseUnits(amount, 6)
  const mintTx = await token.mint(address, formatAmount);
  await mintTx.wait();
  expect(await token.balanceOf(address)).to.equal(formatAmount);
}
async function approveAndDeposit(token, staker, signer, amount) {
  const formatAmount = ethers.utils.parseUnits(amount, 6);
  const approveTx = await token.connect(signer).approve(staker.address, formatAmount);
  await approveTx.wait();
  const depositTx = await staker.connect(signer).deposit(formatAmount);
  await depositTx.wait();
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Deposit %s tokens for %s at block # %s", amount, signer.address, blockNumber);
  return blockNumber;
}
async function withdraw(staker, signer) {
  const withdrawTx = await staker.connect(signer).withdraw();
  await withdrawTx.wait();
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Withdraw from %s at block # %s", signer.address, blockNumber);
  return blockNumber;
}
async function hardWork() {
  await network.provider.send("evm_mine");
  const blockNumber = await ethers.provider.getBlockNumber();
  return blockNumber;
}

describe("", function () {
  it("Mint, Deposit and Withdraw", async function () {

    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy("RewardToken", "RWT", ethers.utils.parseUnits("1000000", 6));
    await rewardToken.deployed();
    console.log("RewardToken deployed to:", rewardToken.address);
  
    const Staker = await ethers.getContractFactory("Staker");
    const staker = await Staker.deploy(rewardToken.address);
    await staker.deployed();
    console.log("Staker deployed to: ", staker.address);

    const signers = await ethers.getSigners();
    const accounts = signers.map(sign => sign.address);
    console.log('');

    // Mint 10000 Tokens to 3 test accounts and 500000 Tokens to Staking Pool.
    await mintForAddress(rewardToken, accounts[0], "10000");
    await mintForAddress(rewardToken, accounts[1], "10000");
    await mintForAddress(rewardToken, accounts[2], "10000");
    await mintForAddress(rewardToken, staker.address, "500000");

    const rewardRate = BigNumber.from(100 * 1e6);

    // Deposit 100 from account[0]
    const deposit1BlockNumber = await approveAndDeposit(rewardToken, staker, signers[0], "100");
    let currentBlockNumber = await hardWork();
    let currentReward = await staker.currentRewards(accounts[0]);
    expect(currentReward).to.equal(
      rewardRate.mul(currentBlockNumber - deposit1BlockNumber)
    );
    console.log("Reward check success for %s at block %s: %s", accounts[0], currentBlockNumber, currentReward.div(1e6));

    // Deposit 100 from account[1]
    const deposit2BlockNumber = await approveAndDeposit(rewardToken, staker, signers[1], "100");
    currentBlockNumber = await hardWork();
    currentReward = await staker.currentRewards(accounts[0]);
    expect(currentReward).to.equal(
      rewardRate.mul(deposit2BlockNumber - deposit1BlockNumber).add(
        rewardRate.mul(currentBlockNumber - deposit2BlockNumber).div(2)
      )
    );
    console.log("Reward check success for %s at block %s: %s", accounts[0], currentBlockNumber, currentReward.div(1e6));
    currentReward = await staker.currentRewards(accounts[1]);
    expect(currentReward).to.equal(
      rewardRate.mul(currentBlockNumber - deposit2BlockNumber).div(2)
    );
    console.log("Reward check success for %s at block %s: %s", accounts[1], currentBlockNumber, currentReward.div(1e6));

    // Deposit 200 from account[2]
    const deposit3BlockNumber = await approveAndDeposit(rewardToken, staker, signers[2], "200");
    currentBlockNumber = await hardWork();
    currentReward = await staker.currentRewards(accounts[0]);
    expect(currentReward).to.equal(
      rewardRate.mul(deposit2BlockNumber - deposit1BlockNumber).add(
        rewardRate.mul(deposit3BlockNumber - deposit2BlockNumber).div(2).add(
          rewardRate.mul(currentBlockNumber - deposit3BlockNumber).div(4)
        )
      )
    );
    console.log("Reward check success for %s at block %s: %s", accounts[0], currentBlockNumber, currentReward.div(1e6));
    currentReward = await staker.currentRewards(accounts[1]);
    expect(currentReward).to.equal(
      rewardRate.mul(deposit3BlockNumber - deposit2BlockNumber).div(2).add(
        rewardRate.mul(currentBlockNumber - deposit3BlockNumber).div(4)
      )
    );
    console.log("Reward check success for %s at block %s: %s", accounts[1], currentBlockNumber, currentReward.div(1e6));
    currentReward = await staker.currentRewards(accounts[2]);
    expect(currentReward).to.equal(
      rewardRate.mul(currentBlockNumber - deposit3BlockNumber).div(2)
    );
    console.log("Reward check success for %s at block %s: %s", accounts[2], currentBlockNumber, currentReward.div(1e6));

    // Withdraw from account[2]
    const withdrawBlockNumber = await withdraw(staker, signers[2]);
    const newBalance = await rewardToken.balanceOf(accounts[2]);
    expect(newBalance).to.equal(
      BigNumber.from(10000 * 1e6).sub(
        BigNumber.from(200 * 1e6 * 2 / 100)
      ).add(
        currentReward.add(
          rewardRate.mul(withdrawBlockNumber - currentBlockNumber).div(2)
        )
      )
    );
    console.log("Balance check after withdraw for %s at block %s: %s", accounts[2], withdrawBlockNumber, newBalance.div(1e6));
  });
});
