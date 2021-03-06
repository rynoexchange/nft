// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestToken is ERC721 {
  constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
  }

  function mint(uint256 _tokenId) external returns(bool) {
    _mint(msg.sender, _tokenId);
    return true;
  }
}