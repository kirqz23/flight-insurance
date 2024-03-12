const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
var BigNumber = require('bignumber.js');
const assert = require('assert');

describe('Flight Insurance Tests', () => {

  // Create a fixture to deploy the contracts and use the same contracts for all tests
  async function deployFixture() {
    const [owner, ...addresses] = await ethers.getSigners();
    console.log("Owner: ", owner.address);
    console.log("Addresses: ", addresses.map(a => a.address));

    const FlightSuretyData = await ethers.getContractFactory("FlightSuretyData");
    const flightSuretyData = await FlightSuretyData.deploy();
    const dataContractAddress = await flightSuretyData.getAddress();
    console.log("FlightSuretyData deployed to:", dataContractAddress);

    const FlightSuretyApp = await ethers.getContractFactory("FlightSuretyApp");
    const flightSuretyApp = await FlightSuretyApp.deploy(dataContractAddress);
    const appContractAddress = await flightSuretyApp.getAddress();
    console.log("FlightSuretyApp deployed to:", appContractAddress);

    // Authorize the app contract to call the data contract
    await flightSuretyData.authorizeCaller(appContractAddress);

    return { flightSuretyData, flightSuretyApp, owner, addresses };

  }

  /****************************************************************************************/
  /*                                  Start tests                                         */                                                          
  /****************************************************************************************/

  it(`has correct initial isOperational() value`, async function () {
    const { flightSuretyApp } = await loadFixture(deployFixture);
    appContractAddress = await flightSuretyApp.getAddress();
    // Get operating status
    let status = await flightSuretyApp.isOperational();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`can block access to setOperatingStatus() for non-contract owner account`, async function () {
    const { addresses } = await loadFixture(deployFixture);
    let accessDenied = false;
    try {
      await flightSuretyData.connect(addresses[2]).setOperatingStatus(false);
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to non-contract owner account");
  });

  it(`can allow access to setOperatingStatus() for contract owner account`, async function () {
    const { owner, flightSuretyData } = await loadFixture(deployFixture);
    let accessDenied = false;
    try {
      await flightSuretyData.connect(owner).setOperatingStatus(false);
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, "Access restricted to contract owner");
  });

  it(`can block access to functions using requireIsOperational when operating status is false`, async function () {
    const { flightSuretyApp, flightSuretyData } = await loadFixture(deployFixture);
    await flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await flightSuretyApp.setTestingMode(true);
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await flightSuretyData.setOperatingStatus(true);

  });
});
