# Resolution

## Tools

Hardhat, openZeppelin: ERC20, Ownable, SafeERC29

The reward distribution algorithm was based on:

[Scalable Reward Distribution on the Ethereum Blockchain](https://uploads-ssl.webflow.com/5ad71ffeb79acc67c8bcdaba/5ad8d1193a40977462982470_scalable-reward-distribution-paper.pdf)

## Notes

I think that the reward rate, withdraw fee and withdraw toggle should be on the Stake.sol rather than RewardToken.sol. This information belongs to the Stake.sol domain.

The reward rate should be on the staker.sol since each time it is modified the reward until the current block should be calculated, otherwise the reward could not match the expected output on withdraws. Moving setRewardRate to Stake.sol solves this issue updating the calculated reward each time the setRewardRate function is called.

With enough time the Staker.sol could run out of token to pay the withdraws so once we mint tokens to the contract address we should calculate for how long we want it to be able to pay the reward per block

# Challenge

Create and deploy (locally) an ERC20 token and a staking contract that will distribute rewards to stakers over time. No need for an app or UI. You can reuse published or open source code, but you must indicate the source and what you have modified.

## Deliverable

Create a PR from this repository and add all your codebase, tests, requirements and tool usage to your README.md

## User journey

An account with some balance of the tokens can deposit them into the staking contract (which also has the tokens and distributes them over time). As the time goes by and blocks are being produced, this user should accumulate more of the tokens and can claim the rewards and withdraw the deposit.

## RewardToken.sol

This contract defines an ERC20 token that will be used for staking/rewards. The owner should be able to mint the token, change reward rates and enable/disable withdraw fees (also modifiable)

## Staker.sol

This contract will get deployed with some tokens minted for the distribution to the stakers. And then, according to a schedule, allocate the reward tokens to addresses that deposited those tokens into the contract. The schedule is up to you, but you could say that every block 100 tokens are being distributed; then you'd take the allocated tokens and divide by the total balance of the deposited tokens so each depositor get's proportional share of the rewards. Ultimately, a user will deposit some tokens and later will be able to withdraw the principal amount plus the earned rewards. The following functions must be implemented: deposit(), withdraw()

## Scoring criteria

- launch ERC20 token
- implement reward allocation logic
- safe deposit/withdraw functions (avoid common attack vectors)
- add test cases

## Tools

Recommended tools:

- Hardhat
- Truffle/Ganache
- Remix
- web3.js/ethers.js
