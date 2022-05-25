//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./RewardToken.sol";
import "./interfaces/IStaker.sol";

/**
 * @title Staker Contract to deposit and withdraw RewardToken
 * @dev This contract will get deployed with some tokens minted for the distribution to the stakers
 */
contract Staker is IStaker, Ownable, ReentrancyGuard {
    using SafeERC20 for RewardToken;

    /**
     * @notice Reference of the RewardToken
     */
    RewardToken public rewardToken;

    /**
     * @notice Treasury address where the withdrawal fee will be collected
     */
    address public treasury;

    /**
     * @notice Mapping of the stakers
     */
    mapping(address => StakerInfo) public stakers;

    /**
     * @notice Total number of tokens staked
     */
    uint256 private tokensStaked;

    /**
     * @notice Last block number user calculated the reward
     */
    uint256 private lastRewardedBlock;

    /**
     * @notice Accumulated rewards per share times REWARDS_PRECISION
     */
    uint256 private accumulatedRewardsPerShare; 

    /**
     * @notice Number to cover the big number calculation of the reward
     */
    uint256 private constant REWARDS_PRECISION = 1e18;

    /**
     * @notice Number to cover the big number calculation of the withdrawal fee
     */
    uint256 private constant FEE_PRECISION = 1e9;

    /**
     * @notice Initialize the addresses of the RewardToken and Treasury
     * @dev Sets the values for {rewardToken} and {treasury}
     */
    constructor(address rewardToken_, address treasury_) {
        rewardToken = RewardToken(rewardToken_);
        treasury = treasury_;
    }

    /**
     * @notice Deposit tokens to generate reward
     * @param amount The number of tokens to stake
     */
    function deposit(uint256 amount) external override nonReentrant {
        require(amount > 0, "Deposit amount can't be zero");
        StakerInfo storage staker = stakers[msg.sender];

        harvestRewards();

        staker.amount = staker.amount + amount;
        staker.rewardDebt = staker.amount * accumulatedRewardsPerShare / REWARDS_PRECISION;

        tokensStaked = tokensStaked + amount;

        emit Deposit(msg.sender, amount);
        rewardToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            amount
        );
    }

    /**
     * @notice Withdraw tokens from staking
     * @dev This will withdraw principal amount plus the earned rewards
     * @dev The fee will go to the treasury address
     */
    function withdraw() external override nonReentrant {
        StakerInfo storage staker = stakers[msg.sender];
        uint256 amount = staker.amount;
        require(amount > 0, "Withdraw amount can't be zero");

        harvestRewards();

        staker.amount = 0;
        staker.rewardDebt = staker.amount * accumulatedRewardsPerShare / REWARDS_PRECISION;

        tokensStaked = tokensStaked - amount;

        emit Withdraw(msg.sender, amount);

        uint256 withdrawalFee;
        if (rewardToken.feeStatus()) {
            withdrawalFee = amount * rewardToken.feeRate() / FEE_PRECISION;
        }

        rewardToken.safeTransfer(
            address(msg.sender),
            amount - withdrawalFee
        );
        rewardToken.safeTransfer(
            treasury,
            withdrawalFee
        );
    }

    /**
     * @notice Calculate and withdraw the reward
     * @dev This will calculate the reward amount and withdraw them
     */
    function harvestRewards() public nonReentrant {
        updateRewards();
        StakerInfo storage staker = stakers[msg.sender];
        uint256 rewardsToHarvest = (staker.amount * accumulatedRewardsPerShare / REWARDS_PRECISION) - staker.rewardDebt;
        if (rewardsToHarvest == 0) {
            staker.rewardDebt = staker.amount * accumulatedRewardsPerShare / REWARDS_PRECISION;
            return;
        }
        staker.rewards = 0;
        staker.rewardDebt = staker.amount * accumulatedRewardsPerShare / REWARDS_PRECISION;

        emit HarvestRewards(msg.sender, rewardsToHarvest);
        rewardToken.safeTransfer(msg.sender, rewardsToHarvest);
    }

    /**
     * @notice Calculate the current reward
     * @dev This will update the reward amount per share and last block number
     */
    function updateRewards() private {
        if (tokensStaked == 0) {
            lastRewardedBlock = block.number;
            return;
        }
        uint256 blocksSinceLastReward = block.number - lastRewardedBlock;
        uint256 rewards = blocksSinceLastReward * rewardToken.rewardRate();
        accumulatedRewardsPerShare = accumulatedRewardsPerShare + (rewards * REWARDS_PRECISION / tokensStaked);
        lastRewardedBlock = block.number;
    }
}