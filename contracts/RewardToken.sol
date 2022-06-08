//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC20 token used for staking/rewards in Staker contract
/** @dev The owner is able to mint the token, change reward rates and 
    enable/disable withdraw fees (also modifiable) */
contract RewardToken is ERC20, Ownable {
    // These variables are used by the Staker contract.
    // Just here for the challenge requirements, but normally they would be
    // in the Staker contract

    uint public rewardRate;
    uint16 public withdrawFee;
    // maxWithdrawalFee for user security reasons. If we don't have
    // we should ensure that withdrawFee can't be greater than 10000 = 100%
    uint16 public constant maxWithdrawalFee = 1000; // 10%
    // We could use withdrawFee = 0 as a way to disabled the fees
    // saving gas storage in RewardToken and gas costs in Staker
    // without checking if isWithdrawalFeeEnabled is true or false
    // But as I understood, this approach to enabled/disabled fees
    // is a requirement.
    bool public isWithdrawalFeeEnabled;

    constructor() ERC20("RewardToken", "RTK") {}

    function mint(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function setIsWidrawFeeEnabled(bool _isWithdrawFeeEnabled)
        external
        onlyOwner
    {
        // Avoid calls with no changes
        require(_isWithdrawFeeEnabled != isWithdrawalFeeEnabled, "");
        isWithdrawalFeeEnabled = _isWithdrawFeeEnabled;
    }

    function setWithdrawFee(uint16 _withdrawFee) external onlyOwner {
        require(
            _withdrawFee > 0,
            "withdrawFee can't be 0. Maybe you want to call setIsWidrawFeeEnabled with false"
        );
        require(
            _withdrawFee <= maxWithdrawalFee,
            "withdrawFee can't be greater than 1000"
        );
        withdrawFee = _withdrawFee;
    }

    function setRewardRate(uint _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }
}
