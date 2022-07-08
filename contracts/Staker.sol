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
  event Deposit(uint256 ammount, address by, uint256 timestamp);
  event Withdraw(uint256 ammount, address by, uint256 timestamp);
  event ClaimReward(uint256 ammount, address by, uint256 timestamp);

  RewardToken public immutable rewardToken;

  struct Staker {
    uint256 balance;
  }

  mapping (address => Staker) public stakers;

  uint256 public stakingEndTime;
  uint256 public lastBlockNumber;
  uint256 public totalSupply;
  uint256 public internalSupply;
  uint256 public totalStakers;

  constructor(address _rewardToken) {
    rewardToken = RewardToken(_rewardToken);
  }

  function initStake(uint256 _internalSupply) external onlyOwner {
    require(lastBlockNumber == 0, "stake already inited");

    stakingEndTime = block.timestamp;
    lastBlockNumber = block.number;
    internalSupply = _internalSupply;

    rewardToken.mint(address(this), _internalSupply);

    emit InitStake(_internalSupply, msg.sender);
  }

  /**
    For each block mined, 100 tokens should be minted
    and added to the internalSupply for later distribution
   */
  function updateInternalSupply() public {
    if (block.number <= lastBlockNumber) {
      return;
    }

    uint256 blocks = block.number - lastBlockNumber;
    internalSupply += 100 * blocks;
    lastBlockNumber = block.number;

    rewardToken.mint(address(this), 100 * blocks);
  }

  function deposit(uint256 ammount) external nonReentrant {
    require(ammount > 0, "ammount must be greater than 0");

    if (stakers[msg.sender].balance == 0) {
      totalStakers += 1;
    }

    totalSupply += ammount;
    stakers[msg.sender].balance += ammount;

    updateInternalSupply();

    rewardToken.safeTransferFrom(msg.sender, address(this), ammount);

    emit Deposit(ammount, msg.sender, block.timestamp);
  }

  /**
    Returns the staked 
    balance plus the internalSupply reward 
    without the stakeReward as this one must be minted
   */
  function getWithdraw(address from) internal view returns (uint256) {
    uint256 stakeRate = totalSupply / stakers[from].balance;
    uint256 total = internalSupply / stakeRate;
    return total + stakers[from].balance;
  }

  /**
    Withdraw the staked balance 
    plus the internalSupply reward 
    plus the stakeReward, this one must be minted
   */
  function withdraw() external nonReentrant {
    require(lastBlockNumber != 0, "withdraw unavailable");
    require(stakingEndTime < block.timestamp, "withdraw unavailable by timestamp");
    require(stakers[msg.sender].balance > 0, "no balance staked");

    updateInternalSupply();
    
    uint256 totalWithdraw = getWithdraw(msg.sender);
    uint256 stakeRewards = (stakers[msg.sender].balance * rewardToken.rewardRate()) / 100;

    if (rewardToken.withdrawFeeEnable()) {
      totalWithdraw -= totalWithdraw * rewardToken.withdrawFee() / 100;
      stakeRewards -= stakeRewards * rewardToken.withdrawFee() / 100;
    }

    stakers[msg.sender].balance = 0;
    totalStakers -= 1;

    rewardToken.mint(address(this), stakeRewards);
    rewardToken.safeTransfer(msg.sender, totalWithdraw + stakeRewards);

    emit Withdraw(totalWithdraw, msg.sender, block.timestamp);
  }
}