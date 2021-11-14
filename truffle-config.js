module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*", // Match any network id
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 7545,
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
        evmVersion: "petersburg"
      }
    }
  },
  plugins: ["solidity-coverage"]
};