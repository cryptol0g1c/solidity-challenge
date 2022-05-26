require('solidity-docgen');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const {
  INFURA_ID,
  MNEMONIC,
  ETHERSCAN_API_KEY,
  PRIVATE_KEY_TESTNET,
} = process.env;

const accountsTestnet = PRIVATE_KEY_TESTNET 
  ? [PRIVATE_KEY_TESTNET]  
  : {mnemonic: MNEMONIC};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        }
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_ID}`,
        accounts: accountsTestnet
      },
      gasPrice: "auto"
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
      accounts: accountsTestnet,
      gasPrice: "auto"
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: 50000
  }
};
