// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RewardToken is ERC20, Ownable {

  using SafeMath for uint256;

  bool public isWithdrawFeeEnable;
  uint256 public rewardRate;
  uint256 public withdrawFee;

  event RewardRatesUpdated(uint256 newRate);
  event WithdrawFeeToggled(bool newFee);
  event WithdrawFeeUpdated(uint256 newFee);

  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _rewardRate,
    uint256 _withdrawFee,
    bool _withdrawFeeEnabled
  ) ERC20(_name, _symbol) {
    rewardRate =_rewardRate;
    withdrawFee = _withdrawFee;
    isWithdrawFeeEnable = _withdrawFeeEnabled;
  }

  /// @notice mints tokens t  the destiny address
  /// @dev only allows the onwner
  /// @param _receiver address of the token receiver
  /// @param _amount uint256  amount of tokens to be minted
  function mint(address _receiver, uint256 _amount) external onlyOwner {
    _mint(_receiver, _amount);
  }

  /// @notice sets the token rewards per block
  /// @dev only allows the onwner
  /// @param _newRewardRate uint256 value of the new rate to set
  function setRewardRates(uint256 _newRewardRate) external onlyOwner {
    require(_newRewardRate > 0, "RewardRate is zero");
    rewardRate = _newRewardRate;
    emit RewardRatesUpdated(rewardRate);
  }

  /// @notice sets a new rate for the token rewards
  /// @dev only allows the onwner
  /// @param _newWithrawFee uint256 value of the new rate to set
  function setWithdrawFee(uint256 _newWithrawFee) external onlyOwner {
    require(_newWithrawFee > 0, "WithdrawFee is zero");
    withdrawFee = _newWithrawFee;
    emit WithdrawFeeUpdated(withdrawFee);
  }


  /// @notice enables and disables the withdraw fees
  /// @dev only allows the onwner
  /// @param _enabled bool value for the withdraw fee 
  function enableWithdrawFees(bool _enabled) external onlyOwner {
    isWithdrawFeeEnable = _enabled;
    emit WithdrawFeeToggled(isWithdrawFeeEnable);
  }

}
