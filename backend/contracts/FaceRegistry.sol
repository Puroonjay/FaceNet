// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FaceRegistry {
    struct MediaRecord {
        bytes32 dataHash;
        string sourceUrl;
        string platform;
        string author;
        uint256 timestamp;
        address registeredBy;
    }

    mapping(bytes32 => MediaRecord) public records;

    event MediaRegistered(
        bytes32 indexed dataHash,
        string sourceUrl,
        string platform,
        string author,
        uint256 timestamp,
        address indexed registeredBy
    );

    function registerRecord(
        bytes32 dataHash,
        string memory sourceUrl,
        string memory platform,
        string memory author
    ) external {
        require(records[dataHash].timestamp == 0, "Record already exists on chain");

        records[dataHash] = MediaRecord({
            dataHash: dataHash,
            sourceUrl: sourceUrl,
            platform: platform,
            author: author,
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });

        emit MediaRegistered(dataHash, sourceUrl, platform, author, block.timestamp, msg.sender);
    }

    function getRecord(
        bytes32 dataHash
    )
        public
        view
        returns (
            bool exists,
            uint256 timestamp,
            string memory sourceUrl,
            string memory platform,
            string memory author,
            address registeredBy
        )
    {
        MediaRecord memory record = records[dataHash];
        return (
            record.timestamp > 0,
            record.timestamp,
            record.sourceUrl,
            record.platform,
            record.author,
            record.registeredBy
        );
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
            string memory platform,
            string memory author,
            address registeredBy
        )
    {
        return getRecord(dataHash);
    }
}
