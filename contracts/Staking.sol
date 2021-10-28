// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Staking is Ownable {
    using SafeMath for uint256;

    IERC20 public rewardsToken;
    IERC20 public stakingToken;

    uint private rewardRate = 100;

    uint private withdrawFee = 10;
    bool private withdrawFeeStatus = true;

    uint public lastUpdateTime;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    uint private _totalSupply;
    mapping(address => uint) private _balances;

    event RewardUpdated(address account, uint rewards, uint rewardPerTokenStored, uint lastUpdateTime);
    event Stake(address account, uint amount, uint amountSoFar);
    event Withdraw(address account, uint amount, uint amountRemaining);
    event ClaimReward(address account, uint amount);


    constructor(address _stakingToken, address _rewardsToken) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
    }

    function setRewardRate(uint _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    function getRewardRate() public view returns (uint _rewardRate) {
        return rewardRate;
    }

    function setWithdrawFee(uint _withdrawFee) external onlyOwner {
        withdrawFee = _withdrawFee;
    }

    function getWithdrawFee() public view returns (uint _withdrawFee) {
        return withdrawFee;
    }

    function setWithdrawFeeStatus(bool _withdrawFeeStatus) external onlyOwner {
        withdrawFeeStatus = _withdrawFeeStatus;
    }

    function getWithdrawFeeStatus() public view returns (bool _withdrawFeeStatus) {
        return withdrawFeeStatus;
    }

    function getBalanceOf() public view returns (uint256 _balance) {
        return _balances[msg.sender];
    }

    function getRewardsOf() public view returns (uint256 _balance) {
        return rewards[msg.sender];
    }

    function rewardPerToken() public view returns (uint) {
        if (_totalSupply == 0) {
            return 0;
        }

        uint256 reward_value = 0;
        reward_value = rewardPerTokenStored.add((((block.timestamp.sub(lastUpdateTime)).mul(rewardRate).mul(1e18)).div(_totalSupply)));

        return reward_value;
    }

    function earned(address account) public view returns (uint) {
        return ((_balances[account].mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))).div(1e18)).add(rewards[account]);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;

        emit RewardUpdated(account, rewards[account], rewardPerTokenStored, lastUpdateTime);
        _;
    }

    function stake(uint _amount) external updateReward(msg.sender) {
        require(stakingToken.balanceOf(msg.sender) >= _amount, "Insufficient amount");

        _totalSupply = _totalSupply.add(_amount);
        _balances[msg.sender] = _balances[msg.sender].add(_amount);

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Stake(msg.sender, _amount, _balances[msg.sender]);
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        require(_balances[msg.sender] >= _amount, "Over the limit");

        if (withdrawFeeStatus) {
            _amount = _amount.mul(100 - withdrawFee).div(100);
        }

        bool sent = stakingToken.transfer(msg.sender, _amount);

        require(sent, "Stakingtoken transfer failed");
        _totalSupply = _totalSupply.sub(_amount);
        _balances[msg.sender] = _balances[msg.sender].sub(_amount);

        emit Withdraw(msg.sender, _amount, _balances[msg.sender]);
    }

    function claimReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);

        emit ClaimReward(msg.sender, reward);
    }
}
