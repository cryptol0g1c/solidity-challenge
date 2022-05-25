//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IRewardToken.sol";

/**
 * @title ERC20 token that will be used for staking/rewards
 * @dev The owner should be able to mint the token, change reward rates and enable/disable withdraw fees
 */
contract RewardToken is IRewardToken, ERC20, Ownable {
    /**
     * @notice Status of the withdrawal fee if it is enabled/disabled
     */
    bool public feeStatus;

    /**
     * @notice The number of reward per block
     */
    uint256 public rewardRate;

    /**
     * @notice The rate of fee per withdrawal
     */
    uint256 public feeRate;

    /**
     * @notice Initialize the state variables
     * @dev Sets the values for {name}, {symbol}, {feeStatus}, {rewardRate} and {feeRate}
     */
    constructor(
        string memory name,
        string memory symbol,
        bool feeStatus_,
        uint256 rewardRate_,
        uint256 feeRate_
    ) ERC20(name, symbol) {
        feeStatus = feeStatus_;
        rewardRate =rewardRate_;
        feeRate = feeRate_;
    }

    /**
     * @notice Mint token by owner
     * @dev Only owner can mint tokens
     * @param account Address of the receiver
     * @param amount Number of tokens to be minted
     */
    function mint(address account, uint256 amount) external override onlyOwner {
        _mint(account, amount);
    }

    /**
     * @notice Set the number of reward per block by owner
     * @dev Only owner can set the reward rate
     * @param rewardRate_ Number of reward per block
     */
    function setRewardRate(uint256 rewardRate_) external override onlyOwner {
        require(rewardRate_ > 0, "Invalid reward rate");
        rewardRate = rewardRate_;
    }

    /**
     * @notice Set the rate of fee per withdrawal by owner
     * @dev Only owner can set the fee rate
     * @param feeRate_ Rate of fee per withdrawal
     */
    function setFeeRate(uint256 feeRate_) external override onlyOwner {
        require(feeRate_ > 0, "Invalid fee rate");
        feeRate = feeRate_;
    }

    /**
     * @notice Flip the status of the fee enable/disable
     * @dev Only owner can flip the status
     */
    function flipFeeStatus() external override onlyOwner {
        feeStatus = !feeStatus;
    }
}