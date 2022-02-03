# Solidity Challenge

ERC20 token and a staking contract that will distribute rewards to stakers over time.

## Codebase

https://github.com/AnjiEco/bamboo-stake

https://app.anji.eco/stake

## How to deploy on local

### `npm install`
This will install dependency modules in the project.

### `npm run local-node`
This will run a local node via hardhat.

### `npm run deploy:local`
This will deploy ERC20 and Staking contracts on local.

## How to deploy on Ropsten

### `npm install`
This will install dependency modules in the project.

### `npm run deploy`
This will deploy ERC20 and Staking contracts on Ropsten.

## How to test

### `npm install`
This will install dependency modules in the project.

### `npm run local-node`
This will run a local node via hardhat.

### `npm run test`
This will test smart contracts by minting, depositing, withdrwing. This will check balances and reward before and after when they mint, deposit & withdraw.

#### Testcase

1) Mint 10000 tokens to `Account 1`, `Account 2`, `Account 3`.
Mint 500000 tokens to `Staking Contract`.
2) Deposit 100 tokens from `Account 1`.
3) After one block, check if it gets 100 reward tokens.
4) Deposit 100 tokens from `Account 2`.
5) After one block check it gets 50 reward tokens. And `Account 1` will get more rewards so it will be 100 * blocksSpent + 50.
6) Deposit 200 tokens from `Account 3`.
7) After one block check it gets 50 reward tokens and other accounts get 25 more rewards....
8) Withdraw on `Account 3` and check how much returnes from staking contract.
