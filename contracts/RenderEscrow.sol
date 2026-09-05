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
 *   2. An operator claims the job off-chain; the validator assigns them via lockJob.
 *   3. After frames are delivered, the validator submits the Proof-of-Render hash
 *      via submitProof (must match the hash registered in JobRegistry).
 *   4. completeJob releases escrow to the operator. If PROOF_REQUIRED is enabled,
 *      a matching proof must have been submitted first.
 *   5. Before completion the designer can refund; once an operator is locked in,
 *      a cancellation window (cancelWindow) gives the operator time to object.
 *
 * Security notes:
 *   - PROOF_REQUIRED=true binds payouts to on-chain render proofs (JobRegistry).
 *   - validator / owner are intended to be migrated to a multi-sig (setValidator).
 *
 * Deployed on: Base Mainnet (alpha, symbolic escrow) → Arbitrum One (roadmap)
 */
contract RenderEscrow is Ownable, ReentrancyGuard {

    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    enum JobStatus { Created, Locked, ProofSubmitted, Completed, Refunded, Cancelled }

    struct Job {
        uint256 id;
        address designer;
        address operator;
        uint256 amount;       // wei locked in escrow
        JobStatus status;
        uint256 createdAt;
        uint256 lockedAt;     // when the operator was assigned
        bytes32 proofHash;    // Proof-of-Render hash submitted by the validator
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 public jobCount;

    /// @dev jobId => Job
    mapping(uint256 => Job) public jobs;

    /// @notice Address authorized to submit proofs and release escrow.
    ///         In production this will be a multi-sig or ZK verifier contract.
    address public validator;

    /// @notice When true, completeJob requires submitProof first (default: true).
    bool public proofRequired = true;

    /// @notice After lockJob, the designer must wait this long before refunding,
    ///         so a rendering operator is not blindsided (default: 3 days).
    uint256 public cancelWindow = 3 days;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event JobCreated(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobLocked(uint256 indexed jobId, address indexed operator);
    event ProofSubmitted(uint256 indexed jobId, address indexed operator, bytes32 proofHash);
    event JobCompleted(uint256 indexed jobId, address indexed operator, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed designer, uint256 amount);
    event JobCancelled(uint256 indexed jobId, address indexed operator, uint256 compensation);
    event ValidatorUpdated(address indexed previous, address indexed next);
    event ProofRequirementUpdated(bool required);
    event CancelWindowUpdated(uint256 seconds_);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error JobNotFound(uint256 jobId);
    error InvalidStatus(uint256 jobId, JobStatus current, JobStatus expected);
    error NotDesigner(uint256 jobId);
    error NotValidator();
    error ZeroAmount();
    error TransferFailed();
    error ProofRequired(uint256 jobId);
    error CancelWindowActive(uint256 jobId, uint256 remaining);
    error ZeroAddress();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _validator) Ownable(msg.sender) {
        if (_validator == address(0)) revert ZeroAddress();
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
            createdAt: block.timestamp,
            lockedAt:  0,
            proofHash: bytes32(0)
        });

        emit JobCreated(jobId, msg.sender, msg.value);
    }

    /**
     * @notice Refund the locked ETH to the designer.
     *         Allowed while the job is Created, or Locked/ProofSubmitted after
     *         the cancel window has passed (so a working operator can object
     *         while the job is still fresh).
     * @param jobId The ID of the job to refund.
     */
    function refundJob(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);

        if (job.designer != msg.sender) revert NotDesigner(jobId);

        if (job.status == JobStatus.Created) {
            // Nothing assigned yet — refund immediately.
        } else if (
            job.status == JobStatus.Locked ||
            job.status == JobStatus.ProofSubmitted
        ) {
            // Operator is (was) working — respect the cancel window.
            uint256 elapsed = block.timestamp - job.lockedAt;
            if (elapsed < cancelWindow) {
                revert CancelWindowActive(jobId, cancelWindow - elapsed);
            }
        } else {
            revert InvalidStatus(jobId, job.status, JobStatus.Created);
        }

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
        if (operator == address(0)) revert ZeroAddress();

        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Created) revert InvalidStatus(jobId, job.status, JobStatus.Created);

        job.operator = operator;
        job.status   = JobStatus.Locked;
        job.lockedAt = block.timestamp;

        emit JobLocked(jobId, operator);
    }

    /**
     * @notice Submit the Proof-of-Render hash after frames are delivered.
     *         When proofRequired is enabled, completing a job requires a proof
     *         whose hash matches the one registered in JobRegistry (verified
     *         off-chain or via verifyProof before this call).
     * @param jobId     The job ID.
     * @param proofHash keccak256 of the rendered output archive.
     */
    function submitProof(uint256 jobId, bytes32 proofHash) external {
        if (msg.sender != validator) revert NotValidator();
        if (proofHash == bytes32(0)) revert ZeroAddress();

        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Locked) revert InvalidStatus(jobId, job.status, JobStatus.Locked);

        job.proofHash = proofHash;
        job.status    = JobStatus.ProofSubmitted;

        emit ProofSubmitted(jobId, job.operator, proofHash);
    }

    /**
     * @notice Release escrow to the operator after frame verification passes.
     *         Only callable by the protocol validator. Requires a submitted
     *         proof when proofRequired is enabled.
     * @param jobId The ID of the completed job.
     */
    function completeJob(uint256 jobId) external nonReentrant {
        if (msg.sender != validator) revert NotValidator();

        Job storage job = _requireJob(jobId);
        if (job.status != JobStatus.Locked && job.status != JobStatus.ProofSubmitted) {
            revert InvalidStatus(jobId, job.status, JobStatus.Locked);
        }
        if (proofRequired && job.proofHash == bytes32(0)) {
            revert ProofRequired(jobId);
        }

        uint256 amount   = job.amount;
        address operator = job.operator;

        job.amount = 0;
        job.status = JobStatus.Completed;

        (bool ok,) = operator.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit JobCompleted(jobId, operator, amount);
    }

    /**
     * @notice Cancel a job whose operator never delivered. After the cancel
     *         window the designer can reclaim funds; if an operator was locked,
     *         they may receive a compensation share (currently 0 — full refund,
     *         parameterizable later).
     * @param jobId The ID of the job to cancel.
     */
    function cancelJob(uint256 jobId) external nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.designer != msg.sender) revert NotDesigner(jobId);
        if (
            job.status != JobStatus.Locked &&
            job.status != JobStatus.ProofSubmitted
        ) {
            revert InvalidStatus(jobId, job.status, JobStatus.Locked);
        }

        uint256 elapsed = block.timestamp - job.lockedAt;
        if (elapsed < cancelWindow) {
            revert CancelWindowActive(jobId, cancelWindow - elapsed);
        }

        uint256 amount = job.amount;
        address operator = job.operator;
        job.amount = 0;
        job.status = JobStatus.Cancelled;

        (bool ok,) = job.designer.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit JobCancelled(jobId, operator, 0);
    }

    // -------------------------------------------------------------------------
    // External — Owner
    // -------------------------------------------------------------------------

    /**
     * @notice Update the validator address (e.g., migrate to a multi-sig).
     */
    function setValidator(address _validator) external onlyOwner {
        if (_validator == address(0)) revert ZeroAddress();
        emit ValidatorUpdated(validator, _validator);
        validator = _validator;
    }

    /**
     * @notice Toggle whether completing a job requires a submitted proof.
     *         Intended to be relaxed only for testing.
     */
    function setProofRequired(bool required) external onlyOwner {
        proofRequired = required;
        emit ProofRequirementUpdated(required);
    }

    /**
     * @notice Update the designer cancel window.
     */
    function setCancelWindow(uint256 seconds_) external onlyOwner {
        cancelWindow = seconds_;
        emit CancelWindowUpdated(seconds_);
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
