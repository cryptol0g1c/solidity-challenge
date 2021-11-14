// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {
    using SafeMath for uint256;

    // token decimals
    uint8 public constant DECIMALS = 18;
    // initial token supply
    uint256 public constant INITIAL_SUPPLY =
        1000000000 * (10**uint256(DECIMALS)); // 10000 tokens

    bool private isWithdrawFeeEnabled;
    uint256 private rewardRate;
    uint256 private withdrawFee;
    uint256 private rewardPeriod;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _rewardPeriod,
        uint256 _rewardRate
    ) public ERC20(name, symbol) {
        rewardPeriod = _rewardPeriod;
        rewardRate = _rewardRate;
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice This function sets the _newRewardRate
    /// @param _newRewardRate new Reward Rate
    function setRewardRate(uint256 _newRewardRate) public onlyOwner {
        require(_newRewardRate > 0, "Reward rate must be > 0");
        rewardRate = _newRewardRate;
    }

    function enableWithdrawFee() public onlyOwner {
        isWithdrawFeeEnabled = true;
    }

    function disableWithdrawFee() public onlyOwner {
        isWithdrawFeeEnabled = false;
    }

    function setWithdrawFee(uint256 _newWithdrawFee) public onlyOwner {
        withdrawFee = _newWithdrawFee;
    }

    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }

    function getWtihDrawFee() external view returns (uint256) {
        return withdrawFee;
    }

    function getRewardPeriod() external view returns (uint256) {
        return rewardPeriod;
    }

    function withdrawFeeStatus() external view returns (bool) {
        return isWithdrawFeeEnabled;
    }
}
