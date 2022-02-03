// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "hardhat/console.sol";
import "./interface/IRewardToken.sol";

//Staking Contract
contract Staker is Initializable, OwnableUpgradeable, PausableUpgradeable {

    address public rwTokenAddr;//reward token address
    uint256 public rewardInterval;

    struct Record {
        uint256 stakedAmount;
        uint256 stakedAt;
        uint256 unstakedAmount;
        uint256 rewardAmount;
    }

    IRewardToken private rewardToken;
    //for "records", a mapping of token addresses and user addresses to an user Record struct
    mapping(address => mapping(address => Record)) public records;

    //Event emitted when user stake
    event Stake(address indexed user, uint256 amount, uint256 stakedAt);

    //Event emitted when user unstake
    event Unstake(address indexed user, uint256 amount, address indexed tokenAddr, uint256 reward, uint256 unstakedAt);

    //Event emitted when user withdrawl unstaked token
    event WithdrawUnstaked(address indexed user, uint256 amount, uint256 withdrawAt);

    //Event emitted when user withdrawl their reward token
    event WithdrawRewards(address indexed user, uint256 amount, uint256 withdrawAt);

    //Event emitted when owner set the reward Token address
    event SetRewardTokenAddr(address _rewardTokenAddr);


    /**
      * @dev initialize function
    * @param _rwTokenAddr address of reward token
    */
    function initialize(address _rwTokenAddr) external initializer {
        __Ownable_init();
        __Pausable_init();
        rewardInterval = 1 days;
        rwTokenAddr = _rwTokenAddr;
        rewardToken = IRewardToken(_rwTokenAddr);
    }

    /**
    * @dev external function for users to stake tokens
    * @param tokenAddr address of Staketoken
    * @param amount amount of Staketoken
    */
    function stake(address tokenAddr, uint256 amount) external whenNotPaused {
        console.log("initial values===========>", rewardToken.withdrawFeeEnabled());
        console.log("initial values===========>", rewardToken.getRewardRate(tokenAddr));
        IERC20Upgradeable stakeToken = IERC20Upgradeable(tokenAddr);
        require(stakeToken.balanceOf(msg.sender) >= amount,
            "Request amount exceeds total amounts"
        );
        //If amount is set to zero, stake all of user's balance
        //when stake, it is 0 by default.
        if (amount == 0) {
            amount = stakeToken.balanceOf(msg.sender);
            stakeToken.transferFrom(msg.sender, address(this), amount);
        } else {
            stakeToken.transferFrom(msg.sender, address(this), amount);
        }
        // save reward amount at this moment
        records[tokenAddr][msg.sender].rewardAmount += calculateReward(tokenAddr, msg.sender, records[tokenAddr][msg.sender].stakedAmount);
        records[tokenAddr][msg.sender].stakedAmount += amount;
        records[tokenAddr][msg.sender].stakedAt = block.timestamp;

        console.log("Token address %s was staked %s by %s", tokenAddr, amount, msg.sender);

        emit Stake(tokenAddr, amount, block.timestamp);
    }

    /**
    * @dev external function for users to unstake their stake tokens
    * @param tokenAddr address of Staketoken
    * @param amount amount of Staketoken
    */
    function unstake(address tokenAddr, uint256 amount) external whenNotPaused {
        require(records[tokenAddr][msg.sender].stakedAmount >= amount,
            "Request amount exceeds total staked amount"
        );
        //If amount is set to zero, unstake all of user's staked balance
        //when unstake, it is 0 by default.

        records[tokenAddr][msg.sender].rewardAmount += calculateReward(tokenAddr, msg.sender, records[tokenAddr][msg.sender].stakedAmount);
        if (amount == 0) {
            records[tokenAddr][msg.sender].unstakedAmount = records[tokenAddr][msg.sender].stakedAmount;
            records[tokenAddr][msg.sender].stakedAmount = 0;
        } else {
            records[tokenAddr][msg.sender].stakedAmount -= amount;
            records[tokenAddr][msg.sender].unstakedAmount += amount;
        }

        records[tokenAddr][msg.sender].stakedAt = block.timestamp;

        console.log("Token address %s was unstaked %s by %s", tokenAddr, amount, msg.sender);

        emit Unstake(msg.sender, amount, tokenAddr, records[tokenAddr][msg.sender].rewardAmount, block.timestamp);
    }

    /**
    * @dev external function for users to withdraw their unstaked tokens from this contract to the caller's address
    * @param tokenAddr address of Staketoken
    * @param _amount amount of Staketoken
    */
    function withdrawUnstaked(address tokenAddr, uint256 _amount) external whenNotPaused {
        require(records[tokenAddr][msg.sender].unstakedAmount >= _amount,
            "Request amounts exceeds unstaked amounts"
        );

        uint256 emitAmount;
        IERC20Upgradeable stakeToken = IERC20Upgradeable(tokenAddr);
        if (_amount == 0) {
            emitAmount = records[tokenAddr][msg.sender].unstakedAmount;
            stakeToken.transfer(msg.sender, emitAmount);
            records[tokenAddr][msg.sender].unstakedAmount = 0;
        } else {
            records[tokenAddr][msg.sender].unstakedAmount -= _amount;
            emitAmount = _amount;
            stakeToken.transfer(msg.sender, emitAmount);
        }

        console.log("Unstaked Tokens %s was withdrawal %s by %s", tokenAddr, emitAmount, msg.sender);

        emit WithdrawUnstaked(msg.sender, emitAmount, block.timestamp);
    }

    /**
    * @dev external function for users to withdraw reward tokens from this contract to the caller's address
    * @param tokenAddr address of Staketoken
    * @param _amount amount of Staketoken
    */
    function withdrawReward(address tokenAddr, uint256 _amount) external whenNotPaused {
        // Total rewards at this moment
        uint256 totalRewardAmount = records[tokenAddr][msg.sender].rewardAmount + calculateReward(tokenAddr, msg.sender, records[tokenAddr][msg.sender].stakedAmount);
        console.log("totalRewardAmount=====>", totalRewardAmount);
        require( totalRewardAmount >= _amount,
            "Request amount exceeds total reward amounts"
        );

        uint256 emitAmount;
        if (_amount == 0) {
            emitAmount = totalRewardAmount;
            records[tokenAddr][msg.sender].rewardAmount = 0;
        } else {
            records[tokenAddr][msg.sender].rewardAmount = totalRewardAmount - _amount;
            emitAmount = _amount;
        }
        if(rewardToken.withdrawFeeEnabled()) {
            emitAmount -= emitAmount * rewardToken.withdrawFee() / 100;
        }
        rewardToken.transfer(msg.sender, emitAmount);
        records[tokenAddr][msg.sender].stakedAt = block.timestamp;

        console.log("Reward Tokens %s was withdrawal %s by %s", tokenAddr, emitAmount, msg.sender);

        emit WithdrawRewards(msg.sender, emitAmount, block.timestamp);
    }

    /**
    * @dev public function to calculate rewards based on the duration of staked tokens, staked token amount, reward rate of the staked token, reward interval
    * @param tokenAddr address of StakeToken
    * @param user address of user
    * @param _amount amount of Staketoken
    */
    function calculateReward(address tokenAddr, address user, uint256 _amount) public view returns (uint256) {
        return (((block.timestamp - records[tokenAddr][user].stakedAt) / rewardInterval) * _amount) * rewardToken.getRewardRate(tokenAddr);
    }

    function getTotalReward(address tokenAddr, address user) public view returns(uint256) {
        console.log("current time======>", block.timestamp);
        console.log("staked time=====>", records[tokenAddr][user].stakedAt);
        return records[tokenAddr][user].rewardAmount + calculateReward(tokenAddr, user, records[tokenAddr][user].stakedAmount);
    }
    /**
     * enables owner to pause / unpause contract
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) _pause();
        else _unpause();
    }

    /**
    * @dev external function only for this contract owner to set the reward token address
    * @param _rewardTokenAddr address of reward token
    */
    function setRewardTokenAddr(address _rewardTokenAddr) external onlyOwner {
        rwTokenAddr = _rewardTokenAddr;
        emit SetRewardTokenAddr(_rewardTokenAddr);
    }

}