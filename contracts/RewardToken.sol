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
    uint16 public withdrawalFee;
    // maxWithdrawalFee for user security reasons. If we don't have one
    // we should ensure that withdrawalFee can't be greater than 10000 = 100%
    uint16 public constant maxWithdrawalFee = 1000; // 10%
    // We could use withdrawalFee = 0 as a way to disabled the fees
    // saving gas storage in RewardToken and gas costs in Staker
    // without checking if isWithdrawalFeeEnabled is true or false
    // But as I understood, this approach to enabled/disabled fees
    // is a requirement.
    bool public isWithdrawalFeeEnabled;

    event RewardRateUpdated(uint256);
    event WithdrawalFeeToggled(bool);
    event WithdrawalFeeUpdated(uint16);

    constructor(
        string memory _name,
        string memory _symbol,
        bool _isWithdrawalFeeEnabled,
        uint16 _withdrawalFee,
        uint _rewardRate
    ) ERC20(_name, _symbol) {
        require(_withdrawalFee > 0, "withdrawalFee can't be 0");
        require(
            _withdrawalFee <= maxWithdrawalFee,
            "withdrawalFee can't be greater than 1000"
        );
        withdrawalFee = _withdrawalFee;
        isWithdrawalFeeEnabled = _isWithdrawalFeeEnabled;
        rewardRate = _rewardRate;
    }

    function mint(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function setIsWithdrawalFeeEnabled(bool _isWithdrawalFeeEnabled)
        external
        onlyOwner
    {
        // Avoid calls with no changes
        require(
            _isWithdrawalFeeEnabled != isWithdrawalFeeEnabled,
            "isWithdrawalFeeEnabled already has the valor sent"
        );
        isWithdrawalFeeEnabled = _isWithdrawalFeeEnabled;
        emit WithdrawalFeeToggled(_isWithdrawalFeeEnabled);
    }

    function setWithdrawalFee(uint16 _withdrawalFee) external onlyOwner {
        require(
            _withdrawalFee > 0,
            "withdrawalFee can't be 0. Maybe you want to call setIsWithdrawalFeeEnabled with false"
        );
        require(
            _withdrawalFee <= maxWithdrawalFee,
            "withdrawalFee can't be greater than 1000"
        );
        withdrawalFee = _withdrawalFee;
        emit WithdrawalFeeUpdated(_withdrawalFee);
    }

    function setRewardRate(uint _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
}
