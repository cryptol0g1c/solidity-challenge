//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract RewardToken is ERC20, Ownable {

    bool    public withdrawFeeEnabled;
    uint256 public rewardRate;
    uint256 public withdrawFee;

    event RewardRateUpdated(uint256);
    event WithdrawFeeToggled(bool);
    event WithdrawFeeUpdated(uint256);

    constructor(
        string memory _name,
        string memory _symbol,
        bool _withdrawFeeEnabled,
        uint256 _rewardRate,
        uint256 _withdrawFee
    ) 
    ERC20(_name, _symbol) {
        withdrawFeeEnabled = _withdrawFeeEnabled;
        rewardRate =_rewardRate;
        withdrawFee = _withdrawFee;
    }
        
    /** @dev It makes avaliable he ERC20 _mint function for external calls.
    *
    * Requirements:
    *
    * - only the owner can call this function .
    */

    function mint(address _account, uint256 _amount) external onlyOwner {
        _mint(_account, _amount);
    }


    /** @dev It sets the fee for withdrawals.
    *
    * Requirements:
    *
    * - only the owner can call this function .
    */
    function setWithdrawFee(uint256 _withrawFee) external onlyOwner {
        require(_withrawFee > 0, "Withdraw fee cant' be 0");
        withdrawFee = _withrawFee;
        emit WithdrawFeeUpdated(withdrawFee);
    }


    /** @dev It toggles the fee for withdrawals.
    *
    * Requirements:
    *
    * - only the owner can call this function .
    */
    function enableWithdrawFee(bool _enabled) external onlyOwner {
        withdrawFeeEnabled = _enabled;
        emit WithdrawFeeToggled(withdrawFeeEnabled);
    }

    /** @dev It sets the value of the reward per block.
    *
    * Requirements:
    *
    * - only the owner can call this function .
    */
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        require(_rewardRate> 0, "Reward rate cant' be 0");
        rewardRate = _rewardRate;
        emit RewardRateUpdated(rewardRate);
    }
}
