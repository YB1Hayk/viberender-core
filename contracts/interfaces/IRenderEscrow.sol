// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRenderEscrow
 * @notice Interface for the VibeRender non-custodial escrow contract.
 *
 * All on-chain escrow interactions go through this interface so that:
 *  - The frontend ABI can be generated from the interface alone.
 *  - Future implementations (ERC-20 payment, ZK verifier) are drop-in compatible.
 *  - Third-party integrators can build against a stable surface area.
 */
interface IRenderEscrow {

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum JobStatus { Created, Locked, ProofSubmitted, Completed, Refunded, Cancelled }

    struct Job {
        uint256 id;
        address designer;
        address operator;
        uint256 amount;
        JobStatus status;
        uint256 createdAt;
        uint256 lockedAt;
        bytes32 proofHash;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event JobCreated(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobLocked(uint256 indexed jobId, address indexed operator);
    event ProofSubmitted(uint256 indexed jobId, address indexed operator, bytes32 proofHash);
    event JobCompleted(uint256 indexed jobId, address indexed operator, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobCancelled(uint256 indexed jobId, address indexed operator, uint256 compensation);
    event ValidatorUpdated(address indexed previous, address indexed next);

    // ─────────────────────────────────────────────────────────────────────────
    // Designer actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new render job and lock native ETH as escrow.
     * @return jobId The on-chain ID of the newly created job.
     */
    function createJob() external payable returns (uint256 jobId);

    /**
     * @notice Cancel a job and return locked ETH to the designer.
     *         Allowed from Created immediately; from Locked/ProofSubmitted only
     *         after the cancel window.
     * @param jobId Job to refund. Must be in Created, Locked or ProofSubmitted status.
     */
    function refundJob(uint256 jobId) external;

    /**
     * @notice Cancel a job whose operator never delivered (after cancel window).
     * @param jobId Job to cancel. Must be in Locked or ProofSubmitted status.
     */
    function cancelJob(uint256 jobId) external;

    // ─────────────────────────────────────────────────────────────────────────
    // Validator actions (protocol-controlled)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Assign an operator to a job after they claim it off-chain.
     * @param jobId    The job to lock.
     * @param operator Wallet address of the GPU operator.
     */
    function lockJob(uint256 jobId, address operator) external;

    /**
     * @notice Submit the Proof-of-Render hash (required before completeJob
     *         when proofRequired is enabled).
     * @param jobId     The job to attest.
     * @param proofHash keccak256 of the rendered output archive.
     */
    function submitProof(uint256 jobId, bytes32 proofHash) external;

    /**
     * @notice Release escrow to the operator after frame verification passes.
     * @param jobId The completed job. Must be in Locked or ProofSubmitted status.
     */
    function completeJob(uint256 jobId) external;

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    function setValidator(address _validator) external;
    function setProofRequired(bool required) external;
    function setCancelWindow(uint256 seconds_) external;

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────

    function getJob(uint256 jobId) external view returns (Job memory);
    function jobCount() external view returns (uint256);
    function validator() external view returns (address);
    function proofRequired() external view returns (bool);
    function cancelWindow() external view returns (uint256);
}
