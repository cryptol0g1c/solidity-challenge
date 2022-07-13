/* eslint-disable no-process-exit */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer, account] = await hre.ethers.getSigners();

  /**
   * Deploy RewardToken with deployer as the owner and default admin
   */
  let RewardToken = await hre.ethers.getContractFactory("RewardToken");
  RewardToken = await RewardToken.deploy(150, 75, true);
  await RewardToken.deployed();

  console.log("\n\n-------------------------------------------------\n\n");
  console.log("> RewardToken deployed to:", RewardToken.address);

  /**
   * Deploy Staker with deployer as the owner
   */
  let Staker = await hre.ethers.getContractFactory("Staker");
  Staker = await Staker.deploy(RewardToken.address);
  await Staker.deployed();

  console.log("> Deployer address:", deployer.address);
  console.log("\n\n-------------------------------------------------\n\n");

  /**
   * Mint some tokens to both addresses
   */
  const mintTx = await RewardToken.mint(
    deployer.address,
    hre.ethers.utils.parseEther("250000000000000000000")
  );
  await mintTx.wait();
  const mintTx2 = await RewardToken.mint(
    account.address,
    hre.ethers.utils.parseEther("250000000000000000000")
  );
  await mintTx2.wait();

  console.log(
    "> Balance deployer: ",
    await RewardToken.balanceOf(deployer.address)
  );
  console.log(
    "> Balance account: ",
    await RewardToken.balanceOf(account.address)
  );
  console.log("\n\n-------------------------------------------------\n\n");

  /**
   * Approve Staker contract to move deployer and account tokens
   */
  const approveTx = await RewardToken.approve(
    Staker.address,
    hre.ethers.utils.parseEther("100000000000000000000")
  );
  await approveTx.wait();
  const approveTx2 = await RewardToken.connect(account).approve(
    Staker.address,
    hre.ethers.utils.parseEther("100000000000000000000")
  );
  await approveTx2.wait();

  /**
   * Transfer RewardToken ownership to Staker
   * Staker contract is gonna mint the necessary rewards tokens
   */
  const transferOwnershipTx = await RewardToken.transferOwnership(
    Staker.address
  );
  await transferOwnershipTx.wait();

  console.log("> New owner of RewardToken: ", await RewardToken.owner());
  console.log("\n\n-------------------------------------------------\n\n");

  /**
   * Init staking contract with 500 tokens
   * and just only 10 seconds of lock}
   * just to show how it works
   */
  const initStake = await Staker.initStake(
    hre.ethers.utils.parseEther("500000000000000000000"),
    10
  );
  await initStake.wait();

  console.log(
    "> Stake initiated with: ",
    await Staker.internalSupply(),
    await RewardToken.balanceOf(Staker.address)
  );
  console.log("\n\n-------------------------------------------------\n\n");

  /**
   * Deposit and lock into staker 100 tokens
   */
  const depositTx = await Staker.deposit(
    hre.ethers.utils.parseEther("100000000000000000000")
  );
  await depositTx.wait();
  const depositTx2 = await Staker.connect(account).deposit(
    hre.ethers.utils.parseEther("100000000000000000000")
  );
  await depositTx2.wait();

  console.log("> Total supply: ", await Staker.totalSupply());
  console.log(
    "> Deployer stake data: ",
    await Staker.stakers(deployer.address)
  );
  console.log("> Account stake data: ", await Staker.stakers(account.address));
  console.log("\n\n-------------------------------------------------\n\n");

  // wait 11 seconds to withdraw
  await new Promise((resolve) => setTimeout(resolve, 11000));

  /**
   * Withdraw tokens from staker with rewards
   */
  const withdrawTx = await Staker.withdraw();
  await withdrawTx.wait();
  const withdrawTx2 = await Staker.connect(account).withdraw();
  await withdrawTx2.wait();

  console.log(
    "> Balance deployer: ",
    await RewardToken.balanceOf(deployer.address)
  );
  console.log(
    "> Balance account: ",
    await RewardToken.balanceOf(account.address)
  );
  console.log("> Total supply: ", await Staker.totalSupply());
  console.log(
    "> Deployer stake data: ",
    await Staker.stakers(deployer.address)
  );
  console.log("> Account stake data: ", await Staker.stakers(account.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
