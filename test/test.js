const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Avax Prediction Market", function () {

  let AvaxPredictionFactory;
  let avaxPredictionContract;

  // depoyment parameters
  let oracleAddress;
  let adminAddress;
  let operatorAddress;
  let intervalSeconds;
  let bufferSeconds;
  let minBetAmount;
  let oracleUpdateAllowance;
  let treasuryFee;

  // setup factory and contracts
  beforeEach(async function () {
    const [oracle, admin, operator] = await ethers.getSigners();
    oracleAddress = oracle.address;
    adminAddress = admin.address;
    operatorAddress = operator.address;
    intervalSeconds = 5 * 60;
    bufferSeconds = 1 * 60;
    minBetAmount = 100 // wei
    oracleUpdateAllowance = 1 * 60;
    treasuryFee = 500; // 5%

    AvaxPredictionFactory = await ethers.getContractFactory("AvaxPrediction");
    avaxPredictionContract = await AvaxPredictionFactory.deploy(
      oracleAddress,
      adminAddress,
      operatorAddress,
      intervalSeconds,
      bufferSeconds,
      minBetAmount,
      oracleUpdateAllowance,
      treasuryFee
    );
  });

  it("Should revert deployment if treasury fee too high", async function () {
    await expect(
      AvaxPredictionFactory.deploy(
        oracleAddress,
        adminAddress,
        operatorAddress,
        intervalSeconds,
        bufferSeconds,
        minBetAmount,
        oracleUpdateAllowance,
        2000 // 20%
      )
    ).to.be.revertedWith("Treasury fee too high");
  });

  it("Should be pausable only by admin or operator", async function () {
    const [_, admin, operator, newAcc] = await ethers.getSigners();

    // fails
    await expect(
      avaxPredictionContract.connect(newAcc).pause()
    ).to.be.revertedWith("Not operator/admin");

    // passes
    await avaxPredictionContract.connect(admin).pause();
  });

  it("Should reject if trying to pause an already paused market", async function () {
    const [_, admin] = await ethers.getSigners();
    await avaxPredictionContract.connect(admin).pause();

    await expect(
      avaxPredictionContract.connect(admin).pause()
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should unpause an already paused market", async function () {
    const [_, admin, operator] = await ethers.getSigners();
    await avaxPredictionContract.connect(admin).pause();

    // operator can pause but cannot "unpause"
    await expect(
      avaxPredictionContract.connect(operator).unpause()
    ).to.be.revertedWith("Not admin");

    // only admin can unpause
    await avaxPredictionContract.connect(admin).unpause();
  });


});