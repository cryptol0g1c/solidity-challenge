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
  uint8 public rewardRate;
  uint8 public withdrawFee;
  bool public withdrawEnable;

  event Mint(uint256 supply, address to);
  event SetRewardRate(uint8 _rewardRate, address by);
  event SetWithdrawFee(uint8 _withdrawFee, address by);
  event SetWithdrawEnable(bool _withdrawEnable, address by);
  
  constructor(uint8 _rewardRate, uint8 _withdrawFee, bool _withdrawEnable) ERC20("REWARDTOKEN", "RTKN") {
    require(_rewardRate > 0, "_rewardRate must be greater than 0");
    require(_withdrawFee < 100, "withdrawFee must be minor than 100");

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    rewardRate = _rewardRate;
    withdrawFee = _withdrawFee;
    withdrawEnable = _withdrawEnable;
  }

  function mint(uint256 supply, address to) external onlyOwner {
    _mint(to, supply);

    emit Mint(supply, to);
  }

  function setRewardRate(uint8 _rewardRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_rewardRate > 0, "_rewardRate must be greater than 0");
    require(_rewardRate != rewardRate, "_rewardRate must be different");

    rewardRate = _rewardRate;

    emit SetRewardRate(_rewardRate, msg.sender);
  }

  function setWithdrawFee(uint8 _withdrawFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_withdrawFee < 100, "_withdrawFee must be minor than 100");
    require(_withdrawFee != withdrawFee, "_withdrawFee must be different");

    withdrawFee = _withdrawFee;

    emit SetWithdrawFee(_withdrawFee, msg.sender);
  }

  function setWithdrawEnable(bool _withdrawEnable) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_withdrawEnable != withdrawEnable, "_withdrawEnable must be different");

    withdrawEnable = _withdrawEnable;

    emit SetWithdrawEnable(_withdrawEnable, msg.sender);
  }
}