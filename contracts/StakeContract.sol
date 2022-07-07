// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CryptoToken.sol";
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#SafeERC20
// Security: wrapper that throw and revert on failure, allows safe calls operations 
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard
// Security: prevent reentrant call in a specific function 
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract StakeContract is ReentrancyGuard, Ownable {
  using SafeERC20 for CryptoToken;

  CryptoToken public immutable cryptoToken;

  struct Staker {
    uint256 balance;
  }

  mapping (address => Staker) public stakers;

  uint256 public stakingStartTime;
  uint256 public lastBlockNumber;

  constructor(address _cryptoToken) {
    cryptoToken = CryptoToken(_cryptoToken);
    stakingStartTime = block.timestamp;
    lastBlockNumber = block.number;
  }

  function mint(uint256 supply, address to) external onlyOwner {
    cryptoToken.mint(supply, to);
  }
}