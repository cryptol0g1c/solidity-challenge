const Staking = artifacts.require("Staking");
// const Mt0Token = artifacts.require("Mt0Token");

module.exports = async function (deployer) {
    // const token = await Mt0Token.deployed();
    // console.log(token.address);

    // deployer.deploy(Staking, token.address);
    deployer.deploy(Staking, "0xD0617aDFdEbeB1575E9ffFB5906051eCbF5F35a7", "0x4c18cc23a98dEA3aFa514E17451fa3C5D2395dAb");
};
