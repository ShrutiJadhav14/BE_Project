// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Identity {
    struct User {
        string name;
        string email;
        string faceDescriptor; // Store as string (JSON stringified array)
        address wallet;
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed user, string name, string email);

    function registerUser(
        string memory _name,
        string memory _email,
        string memory _faceDescriptor
    ) public {
        users[msg.sender] = User(_name, _email, _faceDescriptor, msg.sender);

        emit UserRegistered(msg.sender, _name, _email);
    }

    function getUser(address _addr)
        public
        view
        returns (string memory, string memory, string memory, address)
    {
        User memory u = users[_addr];
        return (u.name, u.email, u.faceDescriptor, u.wallet);
    }
}
