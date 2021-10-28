## Description
ERC20 tokens (Mt0Token, Mt1Token) to be used for staking and rewards are defined.
A function to change reward rates and enable/disable withdraw fees (also modifiable) was implemented.
An account with some balance of the tokens can deposit them into the staking contract (which also has the tokens and distributes them over time). As the time goes by and blocks are being produced, this user should accumulate more of the tokens and can claim the rewards and withdraw the deposit.

## How to setup
- npm install
- truffle compile
- npm run deploy
- npm run deployspec
- npm run verify0
- npm run verify1
- npm run verify_staking

## Technologies
- Truffle
- openzeppelin

## Comment
I am happy to participate in the Code Challenge.
I hope to work with you. Thank you.
