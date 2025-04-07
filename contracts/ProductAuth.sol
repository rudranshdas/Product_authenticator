pragma solidity ^0.8.0;

contract ProductAuth {
    mapping(bytes32 => bool) private productHashes;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function addProductHash(bytes32 hash) public onlyOwner {
        productHashes[hash] = true;
    }

    function verifyProduct(bytes32 hash) public view returns (bool) {
        return productHashes[hash];
    }

    function bulkAddHashes(bytes32[] memory hashes) public onlyOwner {
        for (uint i = 0; i < hashes.length; i++) {
            productHashes[hashes[i]] = true;
        }
    }
}