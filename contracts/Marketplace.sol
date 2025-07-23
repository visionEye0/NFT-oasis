// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INFT {
    function transferFrom(address from, address to, uint tokenId) external;
}

contract Marketplace {
    struct Listing {
        address seller;
        address nft;
        uint tokenId;
        uint price;
    }

    uint public itemCount;
    mapping(uint => Listing) public listings;

    function listNFT(address _nft, uint _tokenId, uint _price) external {
        INFT(_nft).transferFrom(msg.sender, address(this), _tokenId);
        itemCount++;
        listings[itemCount] = Listing(msg.sender, _nft, _tokenId, _price);
    }

    function buyNFT(uint _itemId) external payable {
        Listing memory item = listings[_itemId];
        require(msg.value >= item.price, "Insufficient ETH");
        INFT(item.nft).transferFrom(address(this), msg.sender, item.tokenId);
        payable(item.seller).transfer(item.price);
        delete listings[_itemId];
    }
}
