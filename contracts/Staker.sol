//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface RewardTokenInterface is IERC20 {
    function rewardRate() external view returns (uint256);
    function withdrawFee() external view returns (uint256);
    function withdrawFeeEnabled() external view returns (bool);
}

contract Staker is Ownable {

    // Members
    RewardTokenInterface private token;

    mapping(address => uint256) private stakedAmount;
    mapping(address => uint256) private stakeEntry;
    mapping(address => uint256) private accured;
    uint256 private totalStaked;
    uint256 private totalReward;
    uint256 private totalAccured;
    uint256 private constant STAKING_MAGNITUDE = 10 ** 6 * 10 ** 18;
    uint256 private prevBlock;

    // Events
    event Staked(address, uint256);
    event Withdrawn(address, uint256);
    event Claimed(address, uint256);

    constructor(address _token) {
        token = RewardTokenInterface(_token);
    }

    function _calculateReward(address _addy) private view returns (uint256) {
        uint256 calcReward = totalReward;
        uint256 calcAccured = totalAccured;

        if(totalStaked > 0) {
            uint256 newReward = token.rewardRate() * (block.number - prevBlock);
            calcReward += newReward;
            calcAccured += newReward * STAKING_MAGNITUDE / totalStaked;
        }

        return stakedAmount[_addy] * (calcAccured - stakeEntry[_addy]) / STAKING_MAGNITUDE;
    } 

    function currentRewards(address _addy) public view returns (uint256) {
        return accured[_addy] + _calculateReward(_addy);
    }

    function _calculateRewardPool() private {
        if(prevBlock == 0)
            prevBlock = block.number;

        if(totalStaked > 0) {
            uint256 newReward = token.rewardRate() * (block.number - prevBlock);
            totalReward += newReward;
            totalAccured += newReward * STAKING_MAGNITUDE / totalStaked;
        }

        prevBlock = block.number;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount should be greater than 0");

        uint256 initialStakedBalance = token.balanceOf(address(this));
        token.transferFrom(_msgSender(), address(this), amount);
        uint256 newStakedBalance = token.balanceOf(address(this));
        uint256 stakedReceived = newStakedBalance - initialStakedBalance;
        require(amount == stakedReceived, "Amount should be fully stacked");

        if(stakedAmount[_msgSender()] > 0)
            accured[_msgSender()] = currentRewards(_msgSender());

        _calculateRewardPool();

        stakedAmount[_msgSender()] += stakedReceived;
        totalStaked += stakedReceived;
        
        stakeEntry[_msgSender()] = totalAccured;

        emit Staked(_msgSender(), stakedReceived);
    }

    function withdraw() external {
        require(stakedAmount[_msgSender()] > 0, "No staked tokens");

        if(currentRewards(_msgSender()) > 0)
            claim();

        _calculateRewardPool();

        uint256 amountToWithdraw = stakedAmount[_msgSender()];
        if(token.withdrawFeeEnabled()) {
            amountToWithdraw -= amountToWithdraw * token.withdrawFee() / 100;
        }
        totalStaked -= stakedAmount[_msgSender()];
        stakedAmount[_msgSender()] -= stakedAmount[_msgSender()];

        stakeEntry[_msgSender()] = totalAccured;

        token.transfer(_msgSender(), amountToWithdraw);
        emit Withdrawn(_msgSender(), amountToWithdraw);
    }

    function claim() public {
        require(currentRewards(_msgSender()) > 0, "No claimable rewards");
        require(token.balanceOf(_msgSender()) >= stakedAmount[_msgSender()], "Not enough tokens in reward pool");

        accured[_msgSender()] = currentRewards(_msgSender());

        uint256 amountToClaim = accured[_msgSender()];
        totalReward -= accured[_msgSender()];
        accured[_msgSender()] -= accured[_msgSender()];
        stakeEntry[_msgSender()] = totalAccured;
   
        token.transfer(_msgSender(), amountToClaim);
        emit Withdrawn(_msgSender(), amountToClaim);
    }
}
