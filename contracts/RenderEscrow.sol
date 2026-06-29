// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RenderEscrow
 * @notice Non-custodial escrow for decentralized GPU render jobs.
 *
 * Flow:
 *   1. Designer calls createJob{value: amount} — ETH is locked in the contract.
 *   2. An operator claims the job off-chain (tracked in JobRegistry).
 *   3. After frame verification, the protocol validator calls completeJob —
 *      ETH is transferred atomically to the operator.
 *   4. If the job is cancelled before completion, the designer calls refundJob.
 *
 * Deployed on: Base Sepolia (testnet) → Base Mainnet + Arbitrum One (Q4 2026)
 */
contract RenderEscrow is Ownable, ReentrancyGuard {

    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    enum JobStatus { Created, Locked, Completed, Refunded }

    struct Job {
        uint256 id;
        address designer;
        address operator;
        uint256 amount;       // wei locked in escrow
        JobStatus status;
        uint256 createdAt;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 public jobCount;

    /// @dev jobId => Job
    mapping(uint256 => Job) public jobs;

    /// @notice Address authorized to call completeJob after frame verification.
    ///         In production this will be a multi-sig or ZK verifier contract.
    address public validator;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event JobCreated(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobLocked(uint256 indexed jobId, address indexed operator);
    event JobCompleted(uint256 indexed jobId, address indexed operator, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed designer, uint256 amount);
    event ValidatorUpdated(address indexed previous, address indexed next);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error JobNotFound(uint256 jobId);
    error InvalidStatus(uint256 jobId, JobStatus current, JobStatus expected);
    error NotDesigner(uint256 jobId);
    error NotValidator();
    error ZeroAmount();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _validator) Ownable(msg.sender) {
        require(_validator != address(0), "Zero validator");
        validator = _validator;
    }

    // -------------------------------------------------------------------------
    // External — Designer
    // -------------------------------------------------------------------------

    /**
     * @notice Create a new render job and lock ETH in escrow.
     * @return jobId The ID of the newly created job.
     */
    function createJob() external payable nonReentrant returns (uint256 jobId) {
        if (msg.value == 0) revert ZeroAmount();

        jobCount++;
        jobId = jobCount;

        jobs[jobId] = Job({
            id:        jobId,
            designer:  msg.sender,
            operator:  address(0),
            amount:    msg.value,
            status:    JobStatus.Created,
            createdAt: block.timestamp
        });

        emit JobCreated(jobId, msg.sender, msg.value);
    }

    /**
     * @notice Refund the locked ETH to the designer.
     *         Can only be called by the designer while the job is Created or Locked.
     * @param jobId The ID of the job to refund.
     */
    function refundJob(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);

        if (job.designer != msg.sender) revert NotDesigner(jobId);
        if (job.status == JobStatus.Completed) revert InvalidStatus(jobId, job.status, JobStatus.Created);
        if (job.status == JobStatus.Refunded)  revert InvalidStatus(jobId, job.status, JobStatus.Created);

        uint256 amount = job.amount;
        job.amount = 0;
        job.status = JobStatus.Refunded;

        (bool ok,) = job.designer.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit JobRefunded(jobId, job.designer, amount);
    }

    // -------------------------------------------------------------------------
    // External — Validator (protocol-controlled)
    // -------------------------------------------------------------------------

    /**
     * @notice Assign an operator to a job (called when operator claims off-chain).
     * @param jobId    The job ID.
     * @param operator The wallet address of the GPU operator.
     */
    function lockJob(uint256 jobId, address operator) external {
        if (msg.sender != validator) revert NotValidator();
        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Created) revert InvalidStatus(jobId, job.status, JobStatus.Created);

        job.operator = operator;
        job.status   = JobStatus.Locked;

        emit JobLocked(jobId, operator);
    }

    /**
     * @notice Release escrow to the operator after frame verification passes.
     *         Only callable by the protocol validator.
     * @param jobId The ID of the completed job.
     */
    function completeJob(uint256 jobId) external nonReentrant {
        if (msg.sender != validator) revert NotValidator();

        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Locked) revert InvalidStatus(jobId, job.status, JobStatus.Locked);

        uint256 amount  = job.amount;
        address operator = job.operator;

        job.amount = 0;
        job.status = JobStatus.Completed;

        (bool ok,) = operator.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit JobCompleted(jobId, operator, amount);
    }

    // -------------------------------------------------------------------------
    // External — Owner
    // -------------------------------------------------------------------------

    /**
     * @notice Update the validator address (e.g., migrate to ZK verifier).
     */
    function setValidator(address _validator) external onlyOwner {
        require(_validator != address(0), "Zero validator");
        emit ValidatorUpdated(validator, _validator);
        validator = _validator;
    }

    // -------------------------------------------------------------------------
    // View
    // -------------------------------------------------------------------------

    function getJob(uint256 jobId) external view returns (Job memory) {
        return _requireJob(jobId);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _requireJob(uint256 jobId) internal view returns (Job storage job) {
        job = jobs[jobId];
        if (job.id == 0) revert JobNotFound(jobId);
    }
}
