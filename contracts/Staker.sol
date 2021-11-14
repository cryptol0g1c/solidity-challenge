// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./RewardToken.sol";

/**
 * @title The Reward token staking Contract.
 * @notice This contract will facilitate staking for the Rewards ERC-20 token.
 */
contract Staker is Ownable {
    using SafeERC20 for RewardToken;
    using SafeMath for uint256;
    using Strings for string;

    RewardToken private _token;
    uint256 constant FEE_DENOMINATOR = 10**4;
    uint256 public constant DECIMALS = 10**18;

    // Staker information struct.
    struct Staker {
        uint256 startBlock;
        uint256 endBlock;
        uint256 amount;
        uint256 cumulativeRewards;
        bool active;
    }

    mapping(address => Staker) public stakersMapping;
    address[] public stakersList;
    uint256 totalAmount;

    modifier onlyStaker() {
        Staker storage staker = stakersMapping[msg.sender];
        require(staker.active);
        _;
    }

    /**
     * @notice Initate staking contract
     * @param token The address of the Rewards token
     */
    constructor(address token) public {
        _token = RewardToken(token);
    }

    /**
     * @notice Make sure Ethers cannot be transferred to this contract
     */
    receive() external payable {
        revert();
    }

    /**
     * @notice Lock up a given amount of RewardToken in the staking contract.
     * @dev A user is required to approve the amount of RewardToken prior to calling this function.
     */
    function deposit(uint256 amount) external {
        //Check if the user did not stake already
        Staker storage staker = stakersMapping[msg.sender];
        require(staker.amount == 0, "User Already staked");

        // Check if user approved necessary amount for staking
        uint256 balance = _token.allowance(msg.sender, address(this));
        require(balance != 0, "User did not approve the tokens");
        require(balance >= amount, "Approved amount less than staking amount");

        // Deposit token from user into This contract
        _token.safeTransferFrom(msg.sender, address(this), balance);

        // Store staker information
        stakersList.push(msg.sender);
        staker.amount = balance;
        staker.startBlock = block.number;
        staker.endBlock = block.number;
        staker.active = true;

        totalAmount += balance;
    }

    /**
     * @notice Withdraw the reward.
     */
    function withdraw() external onlyStaker {
        Staker storage staker = stakersMapping[msg.sender];
        this.canUserWithdraw(staker);
        computeRewards(staker);
        uint256 withdrawAmt = staker.cumulativeRewards.add(staker.amount);
        staker.active = false;
        staker.amount = 0;
        if (_token.withdrawFeeStatus()) {
            withdrawAmt -= _token.getWtihDrawFee();
        }
        _token.safeTransfer(msg.sender, withdrawAmt);
        removeUser(msg.sender);
    }

    /**
     * @notice adhoc method to assign compute rewards by admin for all stakers
     */
    function calculateRewards() external onlyOwner {
        for (uint256 i = 0; i < stakersList.length; i++) {
            // Stakers can only start receiving rewards after 1 day of lockup.
            // If the staker has called to withdraw their stake, don't allocate any more rewards to them.
            Staker storage allStaker = stakersMapping[stakersList[i]];
            try this.canUserWithdraw(allStaker) {} catch Error(
                string memory _error
            ) {
                continue;                
            }
            computeRewards(allStaker);
        }
    }

    /**
     * @notice Method to calculate cumulative rewards for the staker
     * @param staker The address of the staker
     */
    function computeRewards(Staker storage staker)
        internal
        returns (Staker storage)
    {
        uint256 rewardPeriod = (block.number.sub(staker.endBlock)).div(
            _token.getRewardPeriod()
        );
        //@dev precision point upto 2 digits
        uint256 rewardRate = _token
            .getRewardRate()
            .mul(DECIMALS)
            .mul(FEE_DENOMINATOR)
            .div(totalAmount); //@dev allocated Rewards per block / total amount staked
        uint256 propotionalShare = staker
            .amount
            .mul(rewardRate)
            .mul(rewardPeriod)
            .div(FEE_DENOMINATOR);
        staker.cumulativeRewards = staker.cumulativeRewards.add(
            propotionalShare
        );
        staker.endBlock = block.number;
        return staker;
    }

    /**
     * @notice check if the staker can withdraw
     * @param staker The information of the staker
     */
    function canUserWithdraw(Staker memory staker) external {
        require(staker.active, "User did not stake!");
        uint256 rewardPeriod = _token.getRewardPeriod();
        // Stakers can only start receiving rewards after getRewardPeriod
        require(
            block.number.sub(staker.startBlock) >= rewardPeriod,
            "Staking did not complete atleast 1 Blocks, Please claim after"
        ); //todo change the error message
    }

    /**
     * @notice Get the staker details
     * @param staker The address of the staker
     */
    function stakerDetails(address staker)
        external
        view
        returns (Staker memory)
    {
        return stakersMapping[staker];
    }

    /**
     * @notice Remove a user from the staking pool.
     * @param staker The address of the staker
     */
    function removeUser(address staker) internal {
        delete stakersMapping[staker];
        // Delete staker from the array.
        for (uint256 i = 0; i < stakersList.length; i++) {
            if (stakersList[i] == staker) {
                stakersList[i] = stakersList[stakersList.length - 1];
                delete stakersList[stakersList.length - 1];
            }
        }
    }
}
