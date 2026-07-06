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

    enum JobStatus { Created, Locked, Completed, Refunded }

    struct Job {
        uint256 id;
        address designer;
        address operator;
        uint256 amount;
        JobStatus status;
        uint256 createdAt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event JobCreated(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobLocked(uint256 indexed jobId, address indexed operator);
    event JobCompleted(uint256 indexed jobId, address indexed operator, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed designer, uint256 amount);
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
     * @param jobId Job to refund. Must be in Created or Locked status.
     */
    function refundJob(uint256 jobId) external;

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
     * @notice Release escrow to the operator after frame verification passes.
     * @param jobId The completed job. Must be in Locked status.
     */
    function completeJob(uint256 jobId) external;

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────

    function getJob(uint256 jobId) external view returns (Job memory);
    function jobCount() external view returns (uint256);
    function validator() external view returns (address);
}
