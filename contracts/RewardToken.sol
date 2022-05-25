//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IRewardToken.sol";

/**
 * @title The Registry contract for DAO SC
 * @notice Create and manage DAO contracts
*/
contract RewardToken is IRewardToken, ERC20, Ownable {
    bool private feeStatus;
    uint256 public rewardRate;
    uint256 public feeRate;

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

    function mint(address account, uint256 amount) external override onlyOwner {
        _mint(account, amount);
    }

    function setRewardRate(uint256 rewardRate_) external override onlyOwner {
        require(rewardRate_ > 0, "Invalid reward rate");
        rewardRate = rewardRate_;
    }

    function setFeeRate(uint256 feeRate_) external override onlyOwner {
        require(feeRate_ > 0, "Invalid fee rate");
        feeRate = feeRate_;
    }

    function flipFeeStatus() external override onlyOwner {
        feeStatus = !feeStatus;
    }
}