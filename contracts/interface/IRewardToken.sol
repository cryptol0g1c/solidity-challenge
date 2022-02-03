// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IRewardToken is IERC20Upgradeable{
    function withdrawFeeEnabled() external view returns(bool);
    function withdrawFee() external view returns(uint8);
    function getRewardRate(address tokenAddr) external view returns(uint256);
}