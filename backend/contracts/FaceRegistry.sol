// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FaceRegistry {
    struct FaceRecord {
        bytes32 dataHash;
        string sourceUrl;
        string author;
        uint256 timestamp;
        address registeredBy;
    }

    mapping(bytes32 => FaceRecord) public records;

    event FaceRegistered(
        bytes32 indexed dataHash,
        string sourceUrl,
        string author,
        uint256 timestamp,
        address indexed registeredBy
    );

    function registerRecord(
        bytes32 dataHash,
        string memory sourceUrl,
        string memory author
    ) external {
        require(records[dataHash].timestamp == 0, "Record already exists on chain");

        records[dataHash] = FaceRecord({
            dataHash: dataHash,
            sourceUrl: sourceUrl,
            author: author,
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });

        emit FaceRegistered(dataHash, sourceUrl, author, block.timestamp, msg.sender);
    }

    function verifyRecord(
        bytes32 dataHash
    )
        external
        view
        returns (
            bool exists,
            uint256 timestamp,
            string memory sourceUrl,
            string memory author,
            address registeredBy
        )
    {
        FaceRecord memory record = records[dataHash];
        return (
            record.timestamp > 0,
            record.timestamp,
            record.sourceUrl,
            record.author,
            record.registeredBy
        );
    }
}
