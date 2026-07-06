const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobRegistry", function () {
  let registry;
  let owner, prover, designer, operator, other;

  const JOB_ID = 1n;
  const META_HASH  = ethers.keccak256(ethers.toUtf8Bytes('{"jobId":1,"resolution":"4K","frames":240}'));
  const PROOF_HASH = ethers.keccak256(ethers.toUtf8Bytes("rendered-frames-archive"));

  beforeEach(async function () {
    [owner, prover, designer, operator, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("JobRegistry");
    registry = await Factory.deploy(prover.address);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Deployment
  // ─────────────────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the prover correctly", async function () {
      expect(await registry.prover()).to.equal(prover.address);
    });

    it("sets the owner correctly", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("reverts with zero prover address", async function () {
      const Factory = await ethers.getContractFactory("JobRegistry");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWith("Zero prover");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // registerJob
  // ─────────────────────────────────────────────────────────────────────────

  describe("registerJob", function () {
    it("stores metadata hash and emits JobRegistered", async function () {
      await expect(registry.connect(designer).registerJob(JOB_ID, META_HASH))
        .to.emit(registry, "JobRegistered")
        .withArgs(JOB_ID, designer.address, META_HASH);

      const rec = await registry.getRecord(JOB_ID);
      expect(rec.metadataHash).to.equal(META_HASH);
      expect(rec.designer).to.equal(designer.address);
      expect(rec.proofSubmitted).to.equal(false);
    });

    it("records registeredAt timestamp", async function () {
      const tx = await registry.connect(designer).registerJob(JOB_ID, META_HASH);
      const block = await ethers.provider.getBlock(tx.blockNumber);
      const rec = await registry.getRecord(JOB_ID);
      expect(rec.registeredAt).to.equal(BigInt(block.timestamp));
    });

    it("reverts if job is already registered", async function () {
      await registry.connect(designer).registerJob(JOB_ID, META_HASH);
      await expect(
        registry.connect(designer).registerJob(JOB_ID, META_HASH)
      ).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // submitProof
  // ─────────────────────────────────────────────────────────────────────────

  describe("submitProof", function () {
    beforeEach(async function () {
      await registry.connect(designer).registerJob(JOB_ID, META_HASH);
    });

    it("stores proof hash and emits ProofSubmitted", async function () {
      await expect(
        registry.connect(prover).submitProof(JOB_ID, operator.address, PROOF_HASH)
      )
        .to.emit(registry, "ProofSubmitted")
        .withArgs(JOB_ID, operator.address, PROOF_HASH);

      const rec = await registry.getRecord(JOB_ID);
      expect(rec.proofHash).to.equal(PROOF_HASH);
      expect(rec.operator).to.equal(operator.address);
      expect(rec.proofSubmitted).to.equal(true);
    });

    it("reverts if caller is not the prover", async function () {
      await expect(
        registry.connect(other).submitProof(JOB_ID, operator.address, PROOF_HASH)
      ).to.be.revertedWithCustomError(registry, "NotProver");
    });

    it("reverts if job is not registered", async function () {
      await expect(
        registry.connect(prover).submitProof(999n, operator.address, PROOF_HASH)
      ).to.be.revertedWithCustomError(registry, "NotRegistered");
    });

    it("reverts on duplicate proof submission", async function () {
      await registry.connect(prover).submitProof(JOB_ID, operator.address, PROOF_HASH);
      await expect(
        registry.connect(prover).submitProof(JOB_ID, operator.address, PROOF_HASH)
      ).to.be.revertedWithCustomError(registry, "ProofAlreadySubmitted");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // verifyMetadata / verifyProof
  // ─────────────────────────────────────────────────────────────────────────

  describe("verifyMetadata", function () {
    beforeEach(async function () {
      await registry.connect(designer).registerJob(JOB_ID, META_HASH);
    });

    it("returns true for matching hash", async function () {
      expect(await registry.verifyMetadata(JOB_ID, META_HASH)).to.equal(true);
    });

    it("returns false for wrong hash", async function () {
      const wrong = ethers.keccak256(ethers.toUtf8Bytes("tampered"));
      expect(await registry.verifyMetadata(JOB_ID, wrong)).to.equal(false);
    });
  });

  describe("verifyProof", function () {
    beforeEach(async function () {
      await registry.connect(designer).registerJob(JOB_ID, META_HASH);
    });

    it("returns false before proof is submitted", async function () {
      expect(await registry.verifyProof(JOB_ID, PROOF_HASH)).to.equal(false);
    });

    it("returns true after valid proof submitted", async function () {
      await registry.connect(prover).submitProof(JOB_ID, operator.address, PROOF_HASH);
      expect(await registry.verifyProof(JOB_ID, PROOF_HASH)).to.equal(true);
    });

    it("returns false for wrong proof hash", async function () {
      await registry.connect(prover).submitProof(JOB_ID, operator.address, PROOF_HASH);
      const wrong = ethers.keccak256(ethers.toUtf8Bytes("wrong"));
      expect(await registry.verifyProof(JOB_ID, wrong)).to.equal(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // setProver (owner only)
  // ─────────────────────────────────────────────────────────────────────────

  describe("setProver", function () {
    it("updates prover and emits event", async function () {
      await expect(registry.connect(owner).setProver(other.address))
        .to.emit(registry, "ProverUpdated")
        .withArgs(prover.address, other.address);

      expect(await registry.prover()).to.equal(other.address);
    });

    it("reverts if caller is not owner", async function () {
      await expect(
        registry.connect(other).setProver(other.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("reverts for zero address", async function () {
      await expect(
        registry.connect(owner).setProver(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero prover");
    });
  });
});
