// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Mt0Token is ERC20, Ownable {
    uint256 private MINT_AMOUNT = 10 ** 8 * 10 ** 18;
    constructor () ERC20 ("MyTest0Token", "MT0TK") {
        super._mint(msg.sender, MINT_AMOUNT);
    }
}
