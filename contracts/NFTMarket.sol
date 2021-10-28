// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RynoNFTMarket is Ownable, ReentrancyGuard {
  // EVENTS
  event ListingCreated(
    address indexed collection,
    address indexed owner,
    uint256 tokenId,
    uint256 price
  );

  event ListingRemoved(
    address indexed collection,
    uint256 tokenId
  );

  event ListingSold(
    address indexed collection,
    address indexed buyer,
    uint256 tokenId,
    uint256 price
  );

  // STRUCTS
  struct Listing {
    address owner;
    uint256 price;
  }

  // VARIABLES
  mapping(address => mapping(uint256 => Listing)) public listingOf;

  uint public feePerThousand;
  uint256 public minPrice;
  uint256 public maxPrice;

  // METHODS
  constructor() {
    feePerThousand = 5;
    minPrice = 1e18;
    maxPrice = 100_000_000e18;
  }

  function createListing(address _collection, uint256 _tokenId, uint256 _price) external nonReentrant returns(bool) {
    require(_price >= minPrice, 'Ryno:: PRICE_LOW');
    require(_price <= maxPrice, 'Ryno:: PRICE_HIGH');


    require(listingOf[_collection][_tokenId].owner == address(0), 'Ryno:: LISTING_EXISTS');

    ERC721(_collection).transferFrom(msg.sender, address(this), _tokenId);

    Listing memory listing = Listing(msg.sender, _price);

    listingOf[_collection][_tokenId] = listing;

    emit ListingCreated(_collection, msg.sender, _tokenId, _price);

    return true;
  }

  function removeListing(address _collection, uint256 _tokenId) external nonReentrant returns(bool) {
    Listing memory listing = listingOf[_collection][_tokenId];

    require(listing.owner == msg.sender, 'Ryno:: FORBIDDEN');

    ERC721(_collection).transferFrom(address(this), msg.sender, _tokenId);

    delete listingOf[_collection][_tokenId];

    emit ListingRemoved(_collection, _tokenId);

    return true;
  }

  function buyListing(address _collection, uint256 _tokenId) external payable nonReentrant returns(bool) {
    Listing memory listing = listingOf[_collection][_tokenId];

    require(listing.owner != address(0), 'Ryno:: LISTING_NOT_EXISTS');
    require(listing.price == msg.value, 'Ryno:: AMOUNT_NOT_EQUAL');

    ERC721(_collection).transferFrom(address(this), msg.sender, _tokenId);

    uint256 fee = msg.value * feePerThousand / 1000;
    uint256 remaining = msg.value - fee;

    (bool sentRemaining,) = listing.owner.call{value: remaining}("");
    require(sentRemaining, "Ryno:: SENT_ERROR");

    (bool sentFee,) = owner().call{value: fee}("");
    require(sentFee, "Ryno:: SENT_ERROR");

    delete listingOf[_collection][_tokenId];

    emit ListingSold(_collection, msg.sender, _tokenId, listing.price);

    return true;
  }

  function setFeePerThousand(uint _fee) external onlyOwner returns(bool) {
    feePerThousand = _fee;
    return true;
  }

  function setMinPrice(uint _minPrice) external onlyOwner returns(bool) {
    minPrice = _minPrice;
    return true;
  }

  function setMaxPrice(uint _maxPrice) external onlyOwner returns(bool) {
    maxPrice = _maxPrice;
    return true;
  }
}