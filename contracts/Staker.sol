// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SafeTransferERC20.sol";
import "./RewardToken.sol";

contract Staker is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeTransferERC20 for RewardToken;

    event RewardRateChanged(uint256);
    event WithdrawalFeeEnableDisable(bool);
    event WithdrawalFeeRateChanged(uint256);

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event TestEvent(address indexed user, uint256 val);

    // rewardRate is the amount of token minted per block
    uint256 private rewardRate = 100 * (10**18);
    // Reward rate maximum value = 1000 tokens.
    uint256 constant maxRewardRate = 1000 * (10**18);

    // a flag to enable/disable fee while withdrawing tokens.
    bool private withdrawFeeEnabled = false;
    // the unit of withdrawFeeRate is 1 / 10000 of _amount withdrawn
    // the following default value means 3%
    uint256 private withdrawFeeRate = 300;
    // Withdrawal rate maximum value
    // set default to 10%
    uint256 constant maxWithdrawalFeeRate = 1000;
    // RewardToken smart contract
    RewardToken private rewardTokenContract;

    // the last block number
    uint256 lastBlockNumber;
    struct UserInfo {
        uint256 staked;
        uint256 rewardDebt;
    }
    // staked list per user
    mapping(address => UserInfo) private userInfo;
    // totally share of token, times 1e12
    uint256 accumulatedTokenPerShare = 0;

    constructor(RewardToken rewardToken) {
        rewardTokenContract = rewardToken;
        lastBlockNumber = block.number;
    }

    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }

    function setRewardRate(uint256 rate) external onlyOwner {
        require(rate <= maxRewardRate, "Exceeded maximum reward rate");
        rewardRate = rate;
        emit RewardRateChanged(rewardRate);
    }

    function isEnabledWithdrawalFee() external view returns (bool) {
        return withdrawFeeEnabled;
    }

    function enableWidthdrawalFee(bool bEnable) external onlyOwner {
        withdrawFeeEnabled = bEnable;
        emit WithdrawalFeeEnableDisable(withdrawFeeEnabled);
    }

    function getWithdrawalFeeRate() external view returns (uint256) {
        return withdrawFeeRate;
    }

    function setWithdrawalFeeRate(uint256 rate) external onlyOwner {
        require(
            rate <= maxWithdrawalFeeRate,
            "Exceeded maximum withdrawal fee rate"
        );
        require(rate != 0, "Withdrawal fee rate should not be 0");

        withdrawFeeRate = rate;
        emit WithdrawalFeeRateChanged(withdrawFeeRate);
    }

    function getBlocksPassed(uint256 _from, uint256 _to)
        public
        pure
        returns (uint256)
    {
        return _to.sub(_from);
    }

    function deposit(uint256 _amount) public nonReentrant {
        UserInfo storage ui = userInfo[msg.sender];

        require(_amount > 0, "Unable to deposit 0");

        UpdateUserInfo();

        if (ui.staked > 0) {
            uint256 pending = ui
                .staked
                .mul(accumulatedTokenPerShare)
                .div(1e12)
                .sub(ui.rewardDebt);
            if (pending > 0) {
                rewardTokenContract.safeTransfer(address(msg.sender), pending);
            }
        }

        if (_amount > 0) {
            rewardTokenContract.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
            ui.staked = ui.staked.add(_amount);
        }
        ui.rewardDebt = ui.staked.mul(accumulatedTokenPerShare).div(1e12);

        emit Deposit(msg.sender, _amount);
    }

    function getAccTok() external view returns (uint256) {
        return accumulatedTokenPerShare;
    }

    function withdraw(uint256 _amount) public nonReentrant {
        UserInfo storage ui = userInfo[msg.sender];

        uint256 am = _amount;
        if (withdrawFeeEnabled) {
            am = _amount.add(_amount.mul(withdrawFeeRate).div(1e4));
        }

        require(ui.staked >= am, "withdraw: not enough staked");

        UpdateUserInfo();

        if (ui.staked > 0) {
            uint256 pending = ui
                .staked
                .mul(accumulatedTokenPerShare)
                .div(1e12)
                .sub(ui.rewardDebt);
            if (pending > 0) {
                rewardTokenContract.safeTransfer(address(msg.sender), pending);
            }
        }

        if (am > 0) {
            ui.staked = ui.staked.sub(am);
            // disposal of fee
            if (am > _amount) {
                rewardTokenContract.burn(address(this), am.sub(_amount));
            }
            rewardTokenContract.safeTransfer(address(msg.sender), _amount);
        }

        ui.rewardDebt = ui.staked.mul(accumulatedTokenPerShare).div(1e12);

        emit Withdraw(msg.sender, _amount);
    }

    function UpdateUserInfo() public {
        if (block.number <= lastBlockNumber) {
            return;
        }

        uint256 totalSupply = rewardTokenContract.balanceOf(address(this));
        if (totalSupply == 0) {
            lastBlockNumber = block.number;
            return;
        }

        uint256 mulVal = getBlocksPassed(lastBlockNumber, block.number);
        uint256 totalReward = mulVal.mul(rewardRate);
        if (totalReward != 0) {
            rewardTokenContract.mint(address(this), totalReward);
            accumulatedTokenPerShare = accumulatedTokenPerShare.add(
                totalReward.mul(1e12).div(totalSupply)
            );
        }

        lastBlockNumber = block.number;
    }
}
