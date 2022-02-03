//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract RewardToken is ERC20, Ownable {

    uint256 private totalSupplyLimit;           // Prevent mint when totalSupply reaches limit
    uint256 public rewardRate = 0;               // Per Block
    uint8 public withdrawFee = 0;              // Percent
    bool public withdrawFeeEnabled = false;    // Flag for Withdraw Fee

    // Events
    event RewardRateUpdate(uint256);
    event WithdrawFeeUpdate(uint8);
    event WithdrawFeeEnabled();
    event WithdrawFeeDisabled();

    constructor(string memory name_, string memory symbol_, uint256 totalSupply_) ERC20(name_, symbol_) {
        totalSupplyLimit = totalSupply_;
        
        setWithdrawFeeEnabled(true);
        setWithdrawFee(2);
        setRewardRate(100 * 10 ** decimals());
    }
    
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= totalSupplyLimit, "Cannot exceed total supply limit");
        _mint(account, amount);
    }

    function setRewardRate(uint256 _rewardRate) public onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdate(rewardRate);
    }

    function setWithdrawFee(uint8 _withdrawFee) public onlyOwner {
        withdrawFee = _withdrawFee;
        emit WithdrawFeeUpdate(withdrawFee);
    }

    function setWithdrawFeeEnabled(bool _enabled) public onlyOwner {
        withdrawFeeEnabled = _enabled;
        if(withdrawFeeEnabled)
            emit WithdrawFeeEnabled();
        else
            emit WithdrawFeeDisabled();
    }
}
