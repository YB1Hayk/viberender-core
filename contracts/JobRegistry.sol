// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JobRegistry
 * @notice On-chain registry of render job metadata commitments.
 *
 * Stores a content-addressed commitment (keccak256 of job metadata)
 * and the Proof-of-Render hash submitted by the operator.
 * This allows anyone to verify the integrity of a job's parameters
 * and rendered output without storing raw data on-chain.
 *
 * Relationship to RenderEscrow:
 *   RenderEscrow handles funds.
 *   JobRegistry handles verifiable metadata.
 *   Both reference the same jobId.
 *
 * Metadata commitment schema (off-chain):
 *   {
 *     "jobId":       <uint256>,
 *     "title":       <string>,
 *     "resolution":  "1080p" | "4K" | "8K",
 *     "frames":      <uint32>,
 *     "archiveHash": <bytes32>,   // keccak256 of the encrypted archive
 *     "designer":    <address>,
 *     "chainId":     <uint256>
 *   }
 */
contract JobRegistry is Ownable {

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct JobRecord {
        bytes32 metadataHash;   // keccak256 of canonical metadata JSON
        bytes32 proofHash;      // keccak256 of rendered output submitted by operator
        address designer;
        address operator;
        uint256 registeredAt;
        bool    proofSubmitted;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev jobId (matches RenderEscrow jobId) => record
    mapping(uint256 => JobRecord) public records;

    /// @notice Authorized submitter of proof-of-render hashes.
    ///         In production: a validator node or ZK verifier contract.
    address public prover;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event JobRegistered(uint256 indexed jobId, address indexed designer, bytes32 metadataHash);
    event ProofSubmitted(uint256 indexed jobId, address indexed operator, bytes32 proofHash);
    event ProverUpdated(address indexed previous, address indexed next);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error AlreadyRegistered(uint256 jobId);
    error NotRegistered(uint256 jobId);
    error ProofAlreadySubmitted(uint256 jobId);
    error NotProver();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _prover) Ownable(msg.sender) {
        require(_prover != address(0), "Zero prover");
        prover = _prover;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // External — Designer
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Register a job's metadata commitment on-chain.
     *         Called by the designer immediately after locking escrow.
     *
     * @param jobId        Matches the escrow contract's jobId.
     * @param metadataHash keccak256 of the canonical JSON metadata blob.
     */
    function registerJob(uint256 jobId, bytes32 metadataHash) external {
        if (records[jobId].registeredAt != 0) revert AlreadyRegistered(jobId);

        records[jobId] = JobRecord({
            metadataHash:  metadataHash,
            proofHash:     bytes32(0),
            designer:      msg.sender,
            operator:      address(0),
            registeredAt:  block.timestamp,
            proofSubmitted: false
        });

        emit JobRegistered(jobId, msg.sender, metadataHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // External — Prover (protocol validator node)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Submit the Proof-of-Render hash once an operator delivers frames.
     *         Only callable by the authorized prover.
     *
     * @param jobId     Job to attest.
     * @param operator  Wallet of the GPU operator who rendered.
     * @param proofHash keccak256 of the rendered output archive.
     */
    function submitProof(uint256 jobId, address operator, bytes32 proofHash) external {
        if (msg.sender != prover) revert NotProver();

        JobRecord storage rec = records[jobId];
        if (rec.registeredAt == 0) revert NotRegistered(jobId);
        if (rec.proofSubmitted) revert ProofAlreadySubmitted(jobId);

        rec.proofHash      = proofHash;
        rec.operator       = operator;
        rec.proofSubmitted = true;

        emit ProofSubmitted(jobId, operator, proofHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // External — Owner
    // ─────────────────────────────────────────────────────────────────────────

    function setProver(address _prover) external onlyOwner {
        require(_prover != address(0), "Zero prover");
        emit ProverUpdated(prover, _prover);
        prover = _prover;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────

    function getRecord(uint256 jobId) external view returns (JobRecord memory) {
        return records[jobId];
    }

    /**
     * @notice Verify that a given metadata blob matches the on-chain commitment.
     * @param jobId        Job to verify.
     * @param metadataHash Hash to compare against the stored commitment.
     */
    function verifyMetadata(uint256 jobId, bytes32 metadataHash) external view returns (bool) {
        return records[jobId].metadataHash == metadataHash;
    }

    /**
     * @notice Verify the rendered output hash against the on-chain proof.
     * @param jobId     Job to verify.
     * @param proofHash Hash to compare against the stored proof.
     */
    function verifyProof(uint256 jobId, bytes32 proofHash) external view returns (bool) {
        JobRecord storage rec = records[jobId];
        return rec.proofSubmitted && rec.proofHash == proofHash;
    }
}
