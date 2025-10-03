// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    struct User {
        string name;
        string email;
        string faceHashOrIPFS; // Store SHA256 hash or IPFS CID
        address account;
    }

    mapping(address => User) public users;

    event UserRegistered(address account, string name, string faceHashOrIPFS);

    function registerUser(string memory _name, string memory _email, string memory _faceHashOrIPFS) public {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_email).length > 0, "Email required");
        require(bytes(_faceHashOrIPFS).length > 0, "Face data required");

        users[msg.sender] = User(_name, _email, _faceHashOrIPFS, msg.sender);
        emit UserRegistered(msg.sender, _name, _faceHashOrIPFS);
    }

    function getUser(address _account) public view returns (User memory) {
        return users[_account];
    }
}
