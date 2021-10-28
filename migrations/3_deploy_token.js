const Mt1Token = artifacts.require("Mt1Token");

module.exports = function (deployer) {
  deployer.deploy(Mt1Token);
};
