// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Interface of the Staker Contract to deposit and withdraw RewardToken
 * @dev This contract will get deployed with some tokens minted for the distribution to the stakers
 */
interface IStaker {
    /**
     * @notice Information for each staker
     * @member amount The number of tokens user staked
     * @member rewards The number of reward user can harvest
     * @member rewardDebt The number of reward user does not have the right to claim
     */
    struct StakerInfo {
        uint256 amount;
        uint256 rewards;
        uint256 rewardDebt;
    }

    /**
     * @notice This emits when users deposit
     * @param user Address of the user
     * @param amount Number of tokens deposited
     */
    event Deposit(address indexed user, uint256 amount);

    /**
     * @notice This emits when users withdraw the principal amount
     * @param user Address of the user
     * @param amount Number of tokens to withdraw
     */
    event Withdraw(address indexed user, uint256 amount);

    /**
     * @notice This emits when users withdraw the reward tokens
     * @param user Address of the user
     * @param amount Number of tokens to withdraw
     */
    event HarvestRewards(address indexed user, uint256 amount);

    /**
     * @notice Deposit tokens to generate reward
     * @param amount The number of tokens to stake
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Withdraw tokens from staking
     * @dev This will withdraw principal amount plus the earned rewards
     * @dev The fee will go to the treasury address
     */
    function withdraw() external;
}