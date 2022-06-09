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

## Deployed contracts
Contracts deployed to https://testnet.bscscan.com/
- RewardToken deployed to: [0xe3ee3acce613E5fab3a9225619A792b796aA9A37](https://testnet.bscscan.com/address/0x1afa492ba972a12b4e5492c6d7c20df1547831ce#code)
- Staker deployed to: [0x28bcB704BB6D70562c1D61B48A858C46a1c9a204](https://testnet.bscscan.com/address/0x8ea1c67abe52ecfda43fc4913308b6c0d42f048a#code)
- Start block: [20156079](https://testnet.bscscan.com/block/countdown/20156079)

## Tools

- Hardhat
- ethers.js
- [@openzeppelin/contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter)

## To-do real case / with more time

- Testing refactor with typescript and remove redundant code.
- Harvest function and partial withdraw. This could be easily implemented but as I understood the requirements was for a withdraw function of all the staked tokens.
