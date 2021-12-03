// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint totalMintAmount) ERC20(name, symbol) Ownable() {
        _mint(_msgSender(), totalMintAmount);
    }

    function mint(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _to, uint _amount) external onlyOwner {
        _burn(_to, _amount);
    }
}
