// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Interface of the Registry contract for DAO SC
 * @notice Create and manage DAO contracts
*/
interface IRewardToken is IERC20 {
    /**
     * @notice Mint token by owner
     * @dev Only owner can mint tokens
     * @param account Address of the receiver
     * @param amount Number of tokens to be minted
     */
    function mint(address account, uint256 amount) external;

    /**
     * @notice Set the number of reward per block by owner
     * @dev Only owner can set the reward rate
     * @param rewardRate_ Number of reward per block
     */
    function setRewardRate(uint256 rewardRate_) external;

    /**
     * @notice Set the rate of fee per withdrawal by owner
     * @dev Only owner can set the fee rate
     * @param feeRate_ Rate of fee per withdrawal
     */
    function setFeeRate(uint256 feeRate_) external;

    /**
     * @notice Flip the status of the fee enable/disable
     * @dev Only owner can flip the status
     */
    function flipFeeStatus() external;
}