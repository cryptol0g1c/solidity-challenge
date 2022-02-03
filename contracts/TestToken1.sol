// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.5;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TestToken1 is ERC20, Ownable {

    constructor() ERC20("TestToken1", "TT1") {
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

