# Reward ERC-20 Token and Staking smart contract

Create and deploy (locally) an ERC20 token and a staking contract that will distribute rewards to stakers over time.

## Installation

`npm install`

## Run unit-test

`npm run test` or `npm run test-staker`

## Requirements 

- User journey
An account with some balance of the tokens can deposit them into the staking contract (which also has the tokens and distributes them over time). As the time goes by and blocks are being produced, this user should accumulate more of the tokens and can claim the rewards and withdraw the deposit.

- RewardToken.sol
This contract defines an ERC20 token that will be used for staking/rewards. The owner should be able to mint the token, change reward rates and enable/disable withdraw fees (also modifiable)

- Staker.sol
This contract will get deployed with some tokens minted for the distribution to the stakers. And then, according to a schedule, allocate the reward tokens to addresses that deposited those tokens into the contract. The schedule is up to you, but you could say that every block 100 tokens are being distributed; then you'd take the allocated tokens and divide by the total balance of the deposited tokens so each depositor get's proportional share of the rewards. Ultimately, a user will deposit some tokens and later will be able to withdraw the principal amount plus the earned rewards. The following functions must be implemented: deposit(), withdraw()

- Scoring criteria
  * launch ERC20 token
  * implement reward allocation logic
  * safe deposit/withdraw functions (avoid common attack vectors)
  * add test cases

- Tools
  Recommended tools:
  * Hardhat
  * Truffle/Ganache
  * Remix
  * web3.js/ethers.js

## Tool usage
  * Hardhat
  * Ethers.js
  * Solidity version `0.8.10`

## Reference
https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol
https://github.com/Synthetixio/synthetix/blob/develop/contracts/RewardsDistributionRecipient.sol
