// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "hardhat/console.sol";
import "./interface/IRewardToken.sol";

contract RewardToken is Initializable, OwnableUpgradeable, ERC20Upgradeable, ERC20BurnableUpgradeable {
    uint256 private TOTAL_SUPPLY = 6000000000 ether; // max total number of token
    uint8 public withdrawFee = 0; // percentage of transaction amount
    bool public withdrawFeeEnabled = false; // true if withdraw fee is enabled

    // address => allowedToCallFunctions
    mapping(address => bool) private admins;

    //for "rewardRates", a mapping of token address to reward rates. e.g. if APY is 20%, then rewardRate is 20.
    mapping(address => uint) public rewardRates;

    //Event emitted when admin set reward rate for user
    event SetRewardRate(address indexed tokenAddr, uint256 newRewardRate);
    //Event emitted when admin updated withdraw fee
    event WithdrawFeeUpdate(uint8);
    //Event emitted when admin enabled fee mode in withdraw
    event WithdrawFeeEnabled();
    //Event emitted when admin disabled fee mode in withdraw
    event WithdrawFeeDisabled();

    function initialize() public initializer {
        __Ownable_init();
        __ERC20Burnable_init();
        __ERC20_init("RewardToken", "RTK");
        // mint 1000
        _mint(msg.sender, 1000 ether);
    }

    /**
    * enables an address to mint / burn
    * @param addr the address to enable
    */
    function addAdmin(address addr) external onlyOwner {
        admins[addr] = true;
    }

    /**
    * disables an address from minting / burning
    * @param addr the address to disbale
    */
    function removeAdmin(address addr) external onlyOwner {
        admins[addr] = false;
    }

    /**
    * mints RewardToken to a recipient
    * @param to the recipient of the $CHEDDAR
    * @param amount the amount of $CHEDDAR to mint
    */
    function mint(address to, uint256 amount) external{
        require(admins[msg.sender], "Only admins can mint");
        require(totalSupply() + amount <= TOTAL_SUPPLY, "Mint amount exceeds");
        console.log("Minted RewardToken to %s with %s:", to, amount);
        _mint(to, amount);
    }

    /**
    * burns reward token from a holder
    * @param from the holder of the reward token
    * @param amount the amount of reward token to burn
    */
    function burn(address from, uint256 amount) external {
        require(admins[msg.sender], "Only admins can burn");
        _burn(from, amount);
    }

    /**
    * set withdraw fee
    * @param _withdrawFee withdraw fee to set
    */
    function setWithdrawFee(uint8 _withdrawFee) external {
        require(admins[msg.sender], "Only admins can burn");
        withdrawFee = _withdrawFee;
        emit WithdrawFeeUpdate(withdrawFee);
    }

    /**
    * set withdraw fee
    * @param _enabled set withdraw fee enable or disable
    */
    function setWithdrawFeeEnabled(bool _enabled) external {
        require(admins[msg.sender], "Only admins can burn");
        withdrawFeeEnabled = _enabled;
        if(_enabled)
            emit WithdrawFeeEnabled();
        else
            emit WithdrawFeeDisabled();
    }

    /**
    * @dev external function for this contract owner to set the reward rate of a staked token
    * @param tokenAddr address of Staketoken
    * @param rewardRate amount of reward rate. if it is 20%, reward rate is 20.
    */
    function setRewardRate(address tokenAddr, uint256 rewardRate) external {
        require(admins[msg.sender], "Only admins can burn");
        rewardRates[tokenAddr] = rewardRate;
        emit SetRewardRate(tokenAddr, rewardRate);
    }

    function getRewardRate(address tokenAddr) external view returns(uint256) {
        return rewardRates[tokenAddr];
    }
}