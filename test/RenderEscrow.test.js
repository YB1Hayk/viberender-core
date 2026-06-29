const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RenderEscrow", function () {
  let escrow;
  let owner, validator, designer, operator, other;
  const JOB_AMOUNT = ethers.parseEther("0.1");

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

    it("reverts if validator is zero address", async function () {
      const Factory = await ethers.getContractFactory("RenderEscrow");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWith("Zero validator");
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
    });

    it("reverts if caller is not the validator", async function () {
      await expect(
        escrow.connect(other).lockJob(1, operator.address)
      ).to.be.revertedWithCustomError(escrow, "NotValidator");
    });

    it("reverts if job is not in Created status", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);
      await expect(
        escrow.connect(validator).lockJob(1, operator.address)
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

    it("transfers ETH to operator and emits JobCompleted", async function () {
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      await expect(escrow.connect(validator).completeJob(1))
        .to.emit(escrow, "JobCompleted")
        .withArgs(1n, operator.address, JOB_AMOUNT);

      const balanceAfter = await ethers.provider.getBalance(operator.address);
      expect(balanceAfter - balanceBefore).to.equal(JOB_AMOUNT);
    });

    it("zeroes the job amount after completion", async function () {
      await escrow.connect(validator).completeJob(1);
      const job = await escrow.getJob(1);
      expect(job.amount).to.equal(0n);
      expect(job.status).to.equal(2n); // Completed
    });

    it("reverts if caller is not the validator", async function () {
      await expect(
        escrow.connect(other).completeJob(1)
      ).to.be.revertedWithCustomError(escrow, "NotValidator");
    });

    it("reverts if job is not Locked", async function () {
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

    it("refunds ETH to designer from Created state", async function () {
      const balanceBefore = await ethers.provider.getBalance(designer.address);

      const tx = await escrow.connect(designer).refundJob(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * tx.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(designer.address);
      expect(balanceAfter - balanceBefore + gasCost).to.equal(JOB_AMOUNT);
    });

    it("refunds ETH to designer from Locked state", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);

      await expect(escrow.connect(designer).refundJob(1))
        .to.emit(escrow, "JobRefunded")
        .withArgs(1n, designer.address, JOB_AMOUNT);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(3n); // Refunded
    });

    it("reverts if caller is not the designer", async function () {
      await expect(
        escrow.connect(other).refundJob(1)
      ).to.be.revertedWithCustomError(escrow, "NotDesigner");
    });

    it("reverts if job is already Completed", async function () {
      await escrow.connect(validator).lockJob(1, operator.address);
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
  // setValidator (owner only)
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
      ).to.be.revertedWith("Zero validator");
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
