//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC20 token used for staking/rewards in Staker contract
/// @dev The owner is able to mint the token, change reward rates and enable/disable withdraw fees (also modifiable)
contract RewardToken is ERC20, Ownable {
    // These variables are used by the Staker contract.
    // Just here for the challenge requirements, but normally they would be
    // in the Staker contract
    uint public withdrawFee;
    uint public rewardRate;
    bool public isWithdrawFeeEnabled;

    constructor() ERC20("RewardToken", "RTK") {}

    function mint(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function setIsWidrawFeeEnabled(bool _isWithdrawFeeEnabled)
        external
        onlyOwner
    {
        isWithdrawFeeEnabled = _isWithdrawFeeEnabled;
    }

    function setWithdrawFee(uint _withdrawFee) external onlyOwner {
        withdrawFee = _withdrawFee;
    }

    function setRewardRate(uint _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }
}
