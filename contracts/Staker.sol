//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./RewardToken.sol";

contract Staker {
    using SafeERC20 for RewardToken;
    
    RewardToken public rewardToken;
    uint256 public total;
    uint256 public lastPaidBlock;
    uint256 public totalReward;

    struct StakerData {
        uint256 stakeAmount;
        uint256 rewardSnapShot;
    }

    mapping (address=> StakerData) public stakers;
    
    event Deposit(address indexed staker, uint256 amount);
    event Withdraw(address indexed staker, uint256 amount);

    constructor(
        address _rewardToken
    ) 
    {
        rewardToken = RewardToken(_rewardToken);
    }
        
    /** @dev It allow users to deposit an amount to stake.
    *
    * Requirements:
    *
    * - user can only have one active stake .
    */
    function deposit(uint256 _amount) external {
        require(_amount>0, "amount should can't be 0");
        require(stakers[msg.sender].stakeAmount==0, "address already staking");
        _calculateReward();
        total += _amount; 
        stakers[msg.sender] = StakerData(_amount,totalReward);
        rewardToken.safeTransferFrom(msg.sender,address(this),_amount);
    }

    /** @dev withdraws the staked amount plus rewards.
    *
    * Requirements:
    *
    * - user has to have amount in stake.
    */
    function withdraw() external {
        require(stakers[msg.sender].stakeAmount>0, "address has no staking");
        uint256 withdrawFee;
        if (rewardToken.withdrawFeeEnabled()) {
            withdrawFee = rewardToken.withdrawFee();
        }
        _calculateReward();
        total -= stakers[msg.sender].stakeAmount; 
        uint256 toTransfer = (totalReward - stakers[msg.sender].rewardSnapShot+1)*stakers[msg.sender].stakeAmount - withdrawFee;
        delete stakers[msg.sender];
        rewardToken.safeTransfer(msg.sender,toTransfer);
        if (withdrawFee>0) {
            rewardToken.safeTransfer(rewardToken.owner(),withdrawFee);    
        }
    }

    /** @dev calculates the rewards.
    */
    function _calculateReward() private {
        if (lastPaidBlock!=0 && total>0){
            totalReward += ((block.number - lastPaidBlock)*rewardToken.rewardRate())/total;
        }
        lastPaidBlock = block.number;
    }
}
