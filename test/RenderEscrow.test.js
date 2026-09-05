const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RenderEscrow", function () {
  let escrow;
  let owner, validator, designer, operator, other;
  const JOB_AMOUNT = ethers.parseEther("0.1");
  const PROOF = ethers.keccak256(ethers.toUtf8Bytes("rendered-frames"));

  beforeEach(async function () {
    [owner, validator, designer, operator, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("RenderEscrow");
    escrow = await Factory.deploy(validator.address);
  });

  // ---------------------------------------------------------------------------
  // Deployment
  // ---------------------------------------------------------------------------

  describe("Deployment", function () {
    it("sets the validator correctly", async function () {
      expect(await escrow.validator()).to.equal(validator.address);
    });

    it("sets the owner correctly", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("defaults proofRequired to true", async function () {
      expect(await escrow.proofRequired()).to.equal(true);
    });

    it("defaults cancelWindow to 3 days", async function () {
      expect(await escrow.cancelWindow()).to.equal(3n * 24n * 60n * 60n);
    });

    it("reverts if validator is zero address", async function () {
      const Factory = await ethers.getContractFactory("RenderEscrow");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrow,
        "ZeroAddress"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // createJob
  // ---------------------------------------------------------------------------

  describe("createJob", function () {
    it("locks ETH and emits JobCreated", async function () {
      await expect(
        escrow.connect(designer).createJob({ value: JOB_AMOUNT })
      )
        .to.emit(escrow, "JobCreated")
        .withArgs(1n, designer.address, JOB_AMOUNT);

      expect(await ethers.provider.getBalance(escrow.target)).to.equal(JOB_AMOUNT);
    });

    it("increments jobCount on each call", async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      expect(await escrow.jobCount()).to.equal(2n);
    });

    it("stores job fields correctly", async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      const job = await escrow.getJob(1);

      expect(job.id).to.equal(1n);
      expect(job.designer).to.equal(designer.address);
      expect(job.operator).to.equal(ethers.ZeroAddress);
      expect(job.amount).to.equal(JOB_AMOUNT);
      expect(job.status).to.equal(0n); // Created
      expect(job.lockedAt).to.equal(0n);
      expect(job.proofHash).to.equal(ethers.ZeroHash);
    });

    it("reverts with ZeroAmount if no ETH sent", async function () {
      await expect(
        escrow.connect(designer).createJob({ value: 0 })
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
    });
  });

  // ---------------------------------------------------------------------------
  // lockJob
  // ---------------------------------------------------------------------------

  describe("lockJob", function () {
    beforeEach(async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
    });

    it("sets operator and status to Locked", async function () {
      await expect(escrow.connect(validator).lockJob(1, operator.address))
        .to.emit(escrow, "JobLocked")
        .withArgs(1n, operator.address);

      const job = await escrow.getJob(1);
      expect(job.operator).to.equal(operator.address);
      expect(job.status).to.equal(1n); // Locked
      expect(job.lockedAt).to.not.equal(0n);
    });

    it("reverts if caller is not the validator", async function () {
      await expect(
        escrow.connect(other).lockJob(1, operator.address)
      ).to.be.revertedWithCustomError(escrow, "NotValidator");
    });

    it("reverts for zero operator address", async function () {
      await expect(
        escrow.connect(validator).lockJob(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });

    it("reverts if job is not in Created status", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);
      await expect(
        escrow.connect(validator).lockJob(1, operator.address)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ---------------------------------------------------------------------------
  // submitProof
  // ---------------------------------------------------------------------------

  describe("submitProof", function () {
    beforeEach(async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      await escrow.connect(validator).lockJob(1, operator.address);
    });

    it("stores proof hash and moves to ProofSubmitted", async function () {
      await expect(escrow.connect(validator).submitProof(1, PROOF))
        .to.emit(escrow, "ProofSubmitted")
        .withArgs(1n, operator.address, PROOF);

      const job = await escrow.getJob(1);
      expect(job.proofHash).to.equal(PROOF);
      expect(job.status).to.equal(2n); // ProofSubmitted
    });

    it("reverts if caller is not the validator", async function () {
      await expect(
        escrow.connect(other).submitProof(1, PROOF)
      ).to.be.revertedWithCustomError(escrow, "NotValidator");
    });

    it("reverts for zero proof hash", async function () {
      await expect(
        escrow.connect(validator).submitProof(1, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });

    it("reverts if job is not Locked", async function () {
      await escrow.connect(validator).submitProof(1, PROOF);
      await expect(
        escrow.connect(validator).submitProof(1, PROOF)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ---------------------------------------------------------------------------
  // completeJob
  // ---------------------------------------------------------------------------

  describe("completeJob", function () {
    beforeEach(async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      await escrow.connect(validator).lockJob(1, operator.address);
    });

    it("reverts without a submitted proof (proof gate)", async function () {
      await expect(
        escrow.connect(validator).completeJob(1)
      ).to.be.revertedWithCustomError(escrow, "ProofRequired");
    });

    it("transfers ETH to operator after proof and emits JobCompleted", async function () {
      await escrow.connect(validator).submitProof(1, PROOF);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      await expect(escrow.connect(validator).completeJob(1))
        .to.emit(escrow, "JobCompleted")
        .withArgs(1n, operator.address, JOB_AMOUNT);

      const balanceAfter = await ethers.provider.getBalance(operator.address);
      expect(balanceAfter - balanceBefore).to.equal(JOB_AMOUNT);
    });

    it("allows completion from Locked when proofRequired is disabled", async function () {
      await escrow.connect(owner).setProofRequired(false);
      await expect(escrow.connect(validator).completeJob(1))
        .to.emit(escrow, "JobCompleted");
    });

    it("zeroes the job amount after completion", async function () {
      await escrow.connect(validator).submitProof(1, PROOF);
      await escrow.connect(validator).completeJob(1);
      const job = await escrow.getJob(1);
      expect(job.amount).to.equal(0n);
      expect(job.status).to.equal(3n); // Completed
    });

    it("reverts if caller is not the validator", async function () {
      await escrow.connect(validator).submitProof(1, PROOF);
      await expect(
        escrow.connect(other).completeJob(1)
      ).to.be.revertedWithCustomError(escrow, "NotValidator");
    });

    it("reverts if job is Completed", async function () {
      await escrow.connect(validator).submitProof(1, PROOF);
      await escrow.connect(validator).completeJob(1);
      await expect(
        escrow.connect(validator).completeJob(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ---------------------------------------------------------------------------
  // refundJob
  // ---------------------------------------------------------------------------

  describe("refundJob", function () {
    beforeEach(async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
    });

    it("refunds ETH to designer from Created state immediately", async function () {
      const balanceBefore = await ethers.provider.getBalance(designer.address);

      const tx = await escrow.connect(designer).refundJob(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * tx.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(designer.address);
      expect(balanceAfter - balanceBefore + gasCost).to.equal(JOB_AMOUNT);
    });

    it("reverts from Locked while the cancel window is active", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);
      await expect(
        escrow.connect(designer).refundJob(1)
      ).to.be.revertedWithCustomError(escrow, "CancelWindowActive");
    });

    it("refunds from Locked after the cancel window passes", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);

      // Fast-forward 3 days + 1 second
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(escrow.connect(designer).refundJob(1))
        .to.emit(escrow, "JobRefunded")
        .withArgs(1n, designer.address, JOB_AMOUNT);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(4n); // Refunded
    });

    it("reverts if caller is not the designer", async function () {
      await expect(
        escrow.connect(other).refundJob(1)
      ).to.be.revertedWithCustomError(escrow, "NotDesigner");
    });

    it("reverts if job is already Completed", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);
      await escrow.connect(validator).submitProof(1, PROOF);
      await escrow.connect(validator).completeJob(1);
      await expect(
        escrow.connect(designer).refundJob(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("reverts if job is already Refunded", async function () {
      await escrow.connect(designer).refundJob(1);
      await expect(
        escrow.connect(designer).refundJob(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ---------------------------------------------------------------------------
  // cancelJob
  // ---------------------------------------------------------------------------

  describe("cancelJob", function () {
    beforeEach(async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      await escrow.connect(validator).lockJob(1, operator.address);
    });

    it("reverts while the cancel window is active", async function () {
      await expect(
        escrow.connect(designer).cancelJob(1)
      ).to.be.revertedWithCustomError(escrow, "CancelWindowActive");
    });

    it("refunds the designer after the window and emits JobCancelled", async function () {
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(escrow.connect(designer).cancelJob(1))
        .to.emit(escrow, "JobCancelled")
        .withArgs(1n, operator.address, 0n);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(5n); // Cancelled
      expect(job.amount).to.equal(0n);
    });

    it("reverts if caller is not the designer", async function () {
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");
      await expect(
        escrow.connect(other).cancelJob(1)
      ).to.be.revertedWithCustomError(escrow, "NotDesigner");
    });

    it("reverts for a Created job (use refundJob instead)", async function () {
      await escrow.connect(designer).createJob({ value: JOB_AMOUNT });
      await expect(
        escrow.connect(designer).cancelJob(2)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ---------------------------------------------------------------------------
  // Admin functions
  // ---------------------------------------------------------------------------

  describe("setValidator", function () {
    it("updates validator and emits event", async function () {
      await expect(escrow.connect(owner).setValidator(other.address))
        .to.emit(escrow, "ValidatorUpdated")
        .withArgs(validator.address, other.address);

      expect(await escrow.validator()).to.equal(other.address);
    });

    it("reverts if caller is not owner", async function () {
      await expect(
        escrow.connect(other).setValidator(other.address)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("reverts for zero address", async function () {
      await expect(
        escrow.connect(owner).setValidator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });
  });

  describe("setProofRequired", function () {
    it("toggles the flag and emits event", async function () {
      await expect(escrow.connect(owner).setProofRequired(false))
        .to.emit(escrow, "ProofRequirementUpdated")
        .withArgs(false);
      expect(await escrow.proofRequired()).to.equal(false);

      await escrow.connect(owner).setProofRequired(true);
      expect(await escrow.proofRequired()).to.equal(true);
    });

    it("reverts if caller is not owner", async function () {
      await expect(
        escrow.connect(other).setProofRequired(false)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });

  describe("setCancelWindow", function () {
    it("updates the window and emits event", async function () {
      await expect(escrow.connect(owner).setCancelWindow(3600n))
        .to.emit(escrow, "CancelWindowUpdated")
        .withArgs(3600n);
      expect(await escrow.cancelWindow()).to.equal(3600n);
    });

    it("reverts if caller is not owner", async function () {
      await expect(
        escrow.connect(other).setCancelWindow(3600n)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });

  // ---------------------------------------------------------------------------
  // getJob
  // ---------------------------------------------------------------------------

  describe("getJob", function () {
    it("reverts for non-existent job", async function () {
      await expect(escrow.getJob(999)).to.be.revertedWithCustomError(
        escrow,
        "JobNotFound"
      );
    });
  });
});
