// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./RewardToken.sol";
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#SafeERC20
// Security: wrapper that throw and revert on failure, allows safe calls operations 
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard
// Security: prevent reentrant call in a specific function 
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract StakeContract is ReentrancyGuard, Ownable {
  using SafeERC20 for RewardToken;

  event InitStake(uint256 _internalSupply, address by);
  event Stake(uint256 ammount, address by, uint256 timestamp);
  event Withdraw(uint256 ammount, address by, uint256 timestamp);
  event ClaimReward(uint256 ammount, address by, uint256 timestamp);

  RewardToken public immutable rewardToken;

  struct Staker {
    uint256 balance;
    uint256 reward;
    bool withdrawn;
    bool claimed;
  }

  mapping (address => Staker) public stakers;

  // uint256 public stakingStartTime;
  uint256 public lastBlockNumber;
  uint256 public totalSupply;
  uint256 public internalSupply;
  uint256 public totalStakers;

  constructor(address _rewardToken) {
    rewardToken = RewardToken(_rewardToken);
  }

  function initStake(uint256 _internalSupply) external onlyOwner {
    require(lastBlockNumber == 0, "stake already inited");

    // stakingStartTime = block.timestamp;
    lastBlockNumber = block.number;
    internalSupply = _internalSupply;

    rewardToken.mint(_internalSupply, address(this));

    emit InitStake(_internalSupply, msg.sender);
  }

  function stake(uint256 ammount) external nonReentrant {
    require(ammount > 0, "ammount must be greater than 0");

    if (stakers[msg.sender].balance == 0) {
      totalStakers += 1;
    }

    totalSupply += ammount;
    stakers[msg.sender].balance += ammount;
    stakers[msg.sender].claimed = false;
    stakers[msg.sender].withdrawn = false;

    rewardToken.safeTransferFrom(msg.sender, address(this), ammount);

    emit Stake(ammount, msg.sender, block.timestamp);
  }

  /**
    Return the totalReward with rewardRate, view purpose
   */
  function getTotalReward(address from) public view returns (uint256) {
    require(stakers[from].balance > 0, "no balance staked");

    uint256 stakeRate = totalSupply / stakers[from].balance;
    uint256 totalReward = internalSupply / stakeRate;
    uint256 stakeReward = (stakers[from].balance * rewardToken.rewardRate()) / 100;
    totalReward += stakeReward;

    if (rewardToken.withdrawEnable()) {
      totalReward -= totalReward * rewardToken.withdrawFee() / 100;
    }

    return totalReward;
  }

  /**
    Returns the staked 
    balance plus the internalSupply reward 
    without the stakeReward as this one must be minted
   */
  function getWithdraw(address from) internal view returns (uint256) {
    require(stakers[from].balance > 0, "no balance staked");

    uint256 stakeRate = totalSupply / stakers[from].balance;
    uint256 total = internalSupply / stakeRate;
    total += stakers[from].balance;

    return total;
  }

  /**
    Withdraw the staked 
    balance plus the internalSupply reward 
    without the stakeReward as this one must be minted
   */
  function withdraw() external nonReentrant {
    require(stakers[msg.sender].balance > 0, "no balance staked");
    require(stakers[msg.sender].withdrawn == false, "withdraw unavailable");
    require(lastBlockNumber != 0, "withdraw unavailable");
    
    uint256 totalWithdraw = getWithdraw(msg.sender);

    if (rewardToken.withdrawEnable()) {
      totalWithdraw -= totalWithdraw * rewardToken.withdrawFee() / 100;
    }

    totalSupply -= stakers[msg.sender].balance;
    internalSupply -= totalWithdraw - stakers[msg.sender].balance;
    stakers[msg.sender].withdrawn = true;

    rewardToken.safeTransfer(msg.sender, totalWithdraw);

    emit Withdraw(totalWithdraw, msg.sender, block.timestamp);
  }

  /**
    mint reward token and send them to the claimer
   */
  function claimReward() external nonReentrant {
    require(stakers[msg.sender].balance > 0, "no balance staked");
    require(stakers[msg.sender].claimed == false, "claim unavailable");

    stakers[msg.sender].claimed = true;

    rewardToken.mint((stakers[msg.sender].balance * rewardToken.rewardRate()) / 100, msg.sender);

    emit ClaimReward((stakers[msg.sender].balance * rewardToken.rewardRate()) / 100, msg.sender, block.timestamp);
  }
}