//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Staker {
    using SafeERC20 for IERC20;
    
    IERC20  private rewardToken;
    uint256 public total;
    uint256 public lastPaidBlock;
    
    struct StakerData {
        uint256 stakeAmount;
        uint256 rewardSnapShot;
    }

    mapping (address=> StakerData) public stakers;
    
    constructor(
        address _rewardToken
    ) 
    {
        rewardToken = IERC20(_rewardToken);
    }
        
    /** @dev It sets the fee for withdrawals.
    *
    * Requirements:
    *
    * - only the owner can call this function .
    */
    function deposit(uint256 _amount) external {

    }
}
