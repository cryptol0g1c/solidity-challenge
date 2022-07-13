// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// https://docs.openzeppelin.com/contracts/4.x/access-control#using-access-control
// Security: access control, set admin role for permissioning
import "@openzeppelin/contracts/access/AccessControl.sol";
// https://docs.openzeppelin.com/contracts/4.x/access-control#ownership-and-ownable
// Security: access control, only owner can call mint functions
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, AccessControl, Ownable {
  /**
    By convention, this variables and logic hook to them
    should not be inside of this contract rather on the staker one
    but as is a challenge request, I left here
   */
  uint16 public rewardRate;
  uint16 public withdrawFee;
  bool public withdrawFeeEnable;

  event Mint(address to, uint256 supply);
  event SetRewardRate(uint8 _rewardRate, address by);
  event SetWithdrawFee(uint8 _withdrawFee, address by);
  event SetWithdrawFeeEnable(bool _withdrawFeeEnable, address by);
  
  constructor(uint8 _rewardRate, uint8 _withdrawFee, bool _withdrawFeeEnable) ERC20("REWARDTOKEN", "RTKN") {
    require(_rewardRate < 1000, "_rewardRate must be minor than 1000");
    require(_withdrawFee < 1000, "_withdrawFee must be minor than 1000");

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    rewardRate = _rewardRate;
    withdrawFee = _withdrawFee;
    withdrawFeeEnable = _withdrawFeeEnable;
  }

  function mint(address to, uint supply) external onlyOwner {
    _mint(to, supply);

    emit Mint(to, supply);
  }

  function setRewardRate(uint8 _rewardRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_rewardRate < 1000, "_rewardRate must be minor than 1000");
    require(_rewardRate != rewardRate, "_rewardRate must be different");

    rewardRate = _rewardRate;

    emit SetRewardRate(_rewardRate, msg.sender);
  }

  function setWithdrawFee(uint8 _withdrawFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_withdrawFee < 1000, "_withdrawFee must be minor than 1000");
    require(_withdrawFee != withdrawFee, "_withdrawFee must be different");

    withdrawFee = _withdrawFee;

    emit SetWithdrawFee(_withdrawFee, msg.sender);
  }

  function setWithdrawFeeEnable(bool _withdrawFeeEnable) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_withdrawFeeEnable != withdrawFeeEnable, "_withdrawFeeEnable must be different");

    withdrawFeeEnable = _withdrawFeeEnable;

    emit SetWithdrawFeeEnable(_withdrawFeeEnable, msg.sender);
  }
}