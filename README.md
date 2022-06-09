# Contracts
## RewardToken.sol
Mintable ERC20 token with properties of withdrawalFee and rewardRate for an Staking contract.
### Features (owner)
- Mintable.
- Withdrawal fee modifiable and can be enabled/disabled.
- RewardRate modifiable. Can also be disabled setting to 0.
## Staker.sol
Staking contract which receives and rewards with the same tokens.
### Features
- In deployment can set the startBlock.
- User can deposit multiple times.
- Withdraw send all the staked tokens and reward to the user.

## Tools

- Hardhat
- ethers.js
- [@openzeppelin/contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter)

## To-do real case / with more time
- Testing refactor with typescript and remove redundant code.
- Harvest function and partial withdraw. This could be easily implemented but as I understood the requirements was for a withdraw function of all the staked tokens. 