//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract RewardToken is ERC20, Ownable {

    bool    public withdrawFeeEnabled;
    uint256 public rewardRate;
    uint256 public withdrawFee;

    constructor(
        string memory _name,
        string memory _symbol,
        bool _withdrawFeeEnabled,
        uint256 _rewardRate,
        uint256 _withdrawFee
    ) 
    ERC20(_name, _symbol) {
        withdrawFeeEnabled = _withdrawFeeEnabled;
        rewardRate =_rewardRate;
        withdrawFee = _withdrawFee;
    }
        
    /** @dev It makes avaliable ERC20 _mint function for external calls.
     *
     */
    function mint(address _account, uint256 _amount) external onlyOwner {
        _mint(_account, _amount);
    }

}
