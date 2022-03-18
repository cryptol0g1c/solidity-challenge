// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IRewardToken is IERC20Upgradeable {

  function isWithdrawFeeEnable() external view returns(bool);
  function rewardRate() external view returns(uint256);
  function withdrawFee() external view returns(uint256);

}

contract Staker is Initializable, OwnableUpgradeable {

  using SafeMath for uint256;

  IRewardToken public rewardToken;

  uint256 public totalStaked;
  mapping( address => uint256 ) public stakeAmount;
  mapping( address => uint256 ) public stakeTime;
  mapping( address => uint256 ) public stakeReward;

  event Staked(address indexed staker, uint256 amount);
  event Withdrew(address indexed staker, uint256 amount);
  event FeeCollected(uint256 amount);

  function initialize(address _rewardToken) external initializer {
    __Ownable_init();
    rewardToken = IRewardToken(_rewardToken);
  }

  function _calculateRewards(address _account) internal view returns(uint256) {
    return rewardToken.rewardRate().
      mul(block.number - stakeTime[_account]).
      mul(stakeAmount[_account]).
      div(totalStaked);
  }

  /// @notice deposits tokens for staking
  /// @param _amount uint256 amount of tokens to deposit
  function deposit(uint256 _amount) external {

    rewardToken.transferFrom(msg.sender, address(this),  _amount);

    uint256 rewardAmount = stakeAmount[msg.sender] == 0 ? 0 : _calculateRewards(msg.sender);

    totalStaked = totalStaked.add(_amount);
    stakeAmount[msg.sender] = stakeAmount[msg.sender].add(_amount);
    stakeReward[msg.sender] = stakeReward[msg.sender].add(rewardAmount);
    stakeTime[msg.sender] = block.number;

    emit Staked(msg.sender, _amount);

  }

  /// @notice withdraws staked tokens and rewards
  function withdraw() public {
    uint256 _stakeAmount = stakeAmount[msg.sender];
    require(_stakeAmount != 0, "No stakes available");

    uint256 _processedRewards = _calculateRewards(msg.sender);
    uint256 _rewardAmount = stakeReward[msg.sender].add(_processedRewards);

    uint256 _payment = _stakeAmount.add(_rewardAmount);
    address _owner = owner();

    if ( msg.sender != _owner && rewardToken.isWithdrawFeeEnable() ) {
      uint256 withdrawFee = rewardToken.withdrawFee();
      require(_payment > withdrawFee, "Cant pay withdraw fee");
      stakeReward[_owner] = stakeReward[_owner].add(withdrawFee);

      _payment = _payment.sub(withdrawFee);

      emit FeeCollected(withdrawFee);
    }

    totalStaked = totalStaked.sub(_stakeAmount);
    stakeAmount[msg.sender] = 0;
    stakeReward[msg.sender] = 0;
    stakeTime[msg.sender] = block.number;

    rewardToken.transfer(msg.sender, _payment);

    emit Withdrew(msg.sender, _payment);

  }

}
