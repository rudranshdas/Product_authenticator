pragma solidity ^0.8.0;

contract ProductAuth {
    // Mapping for product hashes
    mapping(bytes32 => bool) private productHashes;

    // Mapping to track the owners of the products
    mapping(bytes32 => address) private productOwners;

    // Mapping to track the product's addition time for history
    mapping(bytes32 => uint256) private productAdditionTime;

    // Mapping to track the product's history of additions (timestamps)
    mapping(bytes32 => uint256[]) private productHistory;

    // Array to store all product hashes
    bytes32[] private allProductHashes;

    // Address of the contract owner
    address public owner;

    // Access control roles
    enum Role { Admin, Manager, User }
    mapping(address => Role) public userRoles;

    // Event declarations for logging
    event ProductAdded(bytes32 indexed productHash, address indexed owner);
    event ProductVerified(bytes32 indexed productHash, bool isVerified);
    event RoleAssigned(address indexed user, Role role);

    // Constructor to initialize the owner
    constructor() {
        owner = msg.sender;
        userRoles[owner] = Role.Admin;
    }

    // Modifier for restricting access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Modifier to allow only admins or managers to perform specific actions
    modifier onlyAdminOrManager() {
        require(
            msg.sender == owner || userRoles[msg.sender] == Role.Manager,
            "Not authorized"
        );
        _;
    }

    // Modifier to allow only the product owner to perform specific actions
    modifier onlyProductOwner(bytes32 productHash) {
        require(
            productOwners[productHash] == msg.sender,
            "Not the owner of this product"
        );
        _;
    }

    // Modifier to allow only users with the appropriate role
    modifier onlyRole(Role role) {
        require(userRoles[msg.sender] == role, "Access denied");
        _;
    }

    // Function to add a product hash to the mapping
    function addProductHash(bytes32 hash) public onlyOwner {
        productHashes[hash] = true;
        productOwners[hash] = msg.sender;
        productAdditionTime[hash] = block.timestamp;
        productHistory[hash].push(block.timestamp);
        allProductHashes.push(hash);

        emit ProductAdded(hash, msg.sender);
    }

    // Function to verify if a product hash exists in the mapping
    function verifyProduct(bytes32 hash) public view returns (bool) {
        return productHashes[hash];
    }

    // Bulk function to add multiple product hashes at once
    function bulkAddHashes(bytes32[] memory hashes) public onlyOwner {
        for (uint i = 0; i < hashes.length; i++) {
            productHashes[hashes[i]] = true;
            productOwners[hashes[i]] = msg.sender;
            productAdditionTime[hashes[i]] = block.timestamp;
            productHistory[hashes[i]].push(block.timestamp);
            allProductHashes.push(hashes[i]);

            emit ProductAdded(hashes[i], msg.sender);
        }
    }

    // Function to assign roles to users
    function assignRole(address user, Role role) public onlyOwner {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    // Function to change product ownership
    function transferProductOwnership(bytes32 productHash, address newOwner)
        public
        onlyProductOwner(productHash)
    {
        productOwners[productHash] = newOwner;
    }

    // Function to get the owner of a product by its hash
    function getProductOwner(bytes32 productHash) public view returns (address) {
        return productOwners[productHash];
    }

    // Function to get the addition timestamp of a product
    function getProductAdditionTime(bytes32 productHash)
        public
        view
        returns (uint256)
    {
        return productAdditionTime[productHash];
    }

    // Function to get the history of product additions (timestamps)
    function getProductHistory(bytes32 productHash)
        public
        view
        returns (uint256[] memory)
    {
        return productHistory[productHash];
    }

    // Function to allow product verification by the owner
    function verifyProductOwnership(bytes32 productHash)
        public
        view
        onlyProductOwner(productHash)
        returns (bool)
    {
        return productHashes[productHash];
    }

    // Function to update the verification status of a product (only by owner)
    function updateProductVerificationStatus(bytes32 productHash, bool status)
        public
        onlyOwner
    {
        productHashes[productHash] = status;
        emit ProductVerified(productHash, status);
    }

    // Function to check if the caller is an admin
    function isAdmin() public view returns (bool) {
        return userRoles[msg.sender] == Role.Admin;
    }

    // Function to check if the caller is a manager
    function isManager() public view returns (bool) {
        return userRoles[msg.sender] == Role.Manager;
    }

    // Function to check if the caller is a regular user
    function isUser() public view returns (bool) {
        return userRoles[msg.sender] == Role.User;
    }

    // Function to get the role of a specific user
    function getUserRole(address user) public view returns (Role) {
        return userRoles[user];
    }

    // Function to remove a product from the tracking (only by the owner)
    function removeProduct(bytes32 productHash) public onlyOwner {
        delete productHashes[productHash];
        delete productOwners[productHash];
        delete productAdditionTime[productHash];
        delete productHistory[productHash];

        // Remove from allProductHashes array
        for (uint256 i = 0; i < allProductHashes.length; i++) {
            if (allProductHashes[i] == productHash) {
                allProductHashes[i] = allProductHashes[allProductHashes.length - 1];
                allProductHashes.pop();
                break;
            }
        }

        emit ProductVerified(productHash, false);
    }

    // Function to get all products for a specific user
    function getAllProductsForUser(address user) public view returns (bytes32[] memory) {
        uint256 productCount = 0;
        // Count how many products belong to this user
        for (uint i = 0; i < allProductHashes.length; i++) {
            if (productOwners[allProductHashes[i]] == user) {
                productCount++;
            }
        }

        bytes32[] memory productsForUser = new bytes32[](productCount);
        uint256 index = 0;
        // Populate the array with the products owned by the user
        for (uint i = 0; i < allProductHashes.length; i++) {
            if (productOwners[allProductHashes[i]] == user) {
                productsForUser[index] = allProductHashes[i];
                index++;
            }
        }

        return productsForUser;
    }

    // Function to view the number of products added
    function getTotalProductCount() public view returns (uint256) {
        return allProductHashes.length;
    }

    // Function to view all product hashes
    function getAllProductHashes() public view returns (bytes32[] memory) {
        return allProductHashes;
    }
}
