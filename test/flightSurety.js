const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
var BigNumber = require('bignumber.js');
const assert = require('assert');

describe('Flight Insurance Tests', () => {

  // Create a fixture to deploy the contracts and use the same contracts for all tests
  async function deployFixture() {
    const [owner, ...addresses] = await ethers.getSigners();
    const FlightSuretyData = await ethers.getContractFactory("FlightSuretyData");
    const flightSuretyData = await FlightSuretyData.deploy();

    console.log("Owner: ", owner.address);
    console.log("Addresses: ", addresses.map(a => a.address));
    console.log("FlightSuretyData deployed to:", flightSuretyData.target);

    const FlightSuretyApp = await ethers.getContractFactory("FlightSuretyApp");
    const flightSuretyApp = await FlightSuretyApp.deploy(flightSuretyData.target);

    console.log("FlightSuretyApp deployed to:", flightSuretyApp.target);

    // Authorize the app contract to call the data contract
    //await flightSuretyData.authorizeCaller(flightSuretyApp.target);

    return { flightSuretyData, flightSuretyApp, owner, addresses };

  }

  /****************************************************************************************/
  /*                                  Start tests                                         */                                                          
  /****************************************************************************************/

  it('should deploy contracts', async () => {
    await loadFixture(deployFixture);
  });

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    const { flightSuretyApp } = await loadFixture(deployFixture);
    // Get operating status
    let status = await flightSuretyApp.isOperational();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  // it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
  //   const { addresses } = await loadFixture(deployFixture);
  //   // Ensure that access is denied for non-Contract Owner account
  //   let accessDenied = false;
  //   try {
  //     await flightSuretyData.connect(addresses[2]).setOperatingStatus(false);
  //   }
  //   catch (e) {
  //     accessDenied = true;
  //   }
  //   assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  // });

  // it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
  //   // Ensure that access is allowed for Contract Owner account
  //   let accessDenied = false;
  //   try {
  //     await flightSuretyData.setOperatingStatus(false);
  //   }
  //   catch (e) {
  //     accessDenied = true;
  //   }
  //   assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
  // });

  // it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

  //   await config.flightSuretyData.setOperatingStatus(false);

  //   let reverted = false;
  //   try {
  //     await config.flightSurety.setTestingMode(true);
  //   }
  //   catch (e) {
  //     reverted = true;
  //   }
  //   assert.equal(reverted, true, "Access not blocked for requireIsOperational");

  //   // Set it back for other tests to work
  //   await config.flightSuretyData.setOperatingStatus(true);

  // });

  // it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

  //   // ARRANGE
  //   let newAirline = accounts[2];

  //   // ACT
  //   try {
  //     await config.flightSuretyApp.registerAirline(newAirline, "AIR2", { from: config.firstAirline });
  //   }
  //   catch (e) {

  //   }
  //   let result = await config.flightSuretyData.isAirline.call(newAirline, { from: config.flightSuretyApp.address });

  //   // ASSERT
  //   assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  // });

  // it('First airline is registered when contract is deployed.', async () => {
  //   let result = await config.flightSuretyData.isAirline(config.firstAirline, { from: config.flightSuretyApp.address });
  //   assert.equal(result, true, config.firstAirline + " should be already registered");
  // });

  // it('Only existing airline may register a new airline until there are at least four airlines registered', async () => {
  //   let newAirline = accounts[2];
  //   await config.flightSuretyApp.fund({ from: config.firstAirline, value: Web3.utils.toWei('10', 'ether') });

  //   // ACT
  //   await config.flightSuretyApp.registerAirline(newAirline, "AIR3", { from: config.firstAirline });
  //   let result = await config.flightSuretyData.isAirline.call(newAirline, { from: config.flightSuretyApp.address });

  //   // ASSERT
  //   assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");
  // });


  // it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
  //   // Starting from 2 registered airlines from above tests
  //   await config.flightSuretyApp.registerAirline(accounts[3], "AIR4", { from: config.firstAirline });
  //   assert.equal(await config.flightSuretyData.isAirline.call(accounts[3], { from: config.flightSuretyApp.address }), true, "Airline 3 should be registered");
  //   await config.flightSuretyApp.registerAirline(accounts[4], "AIR5", { from: config.firstAirline });
  //   assert.equal(await config.flightSuretyData.isAirline.call(accounts[4], { from: config.flightSuretyApp.address }), true, "Airline 4 should be registered");

  //   await config.flightSuretyApp.registerAirline(accounts[5], "AIR6", { from: config.firstAirline });
  //   assert.equal(await config.flightSuretyData.isAirline.call(accounts[5], { from: config.flightSuretyApp.address }), false, "Airline 5 should still not be registered");

  //   await config.flightSuretyApp.fund({ from: accounts[2], value: Web3.utils.toWei('10', 'ether') });
  //   await config.flightSuretyApp.fund({ from: accounts[3], value: Web3.utils.toWei('10', 'ether') });

  //   await config.flightSuretyApp.registerAirline(accounts[5], "AIR6", { from: accounts[2] });
  //   try {
  //     await config.flightSuretyApp.registerAirline(accounts[5], "AIR6", { from: accounts[3] });
  //   } catch (e) {
  //     // console.log(e);
  //     // Fails with modifier: Airline is already registered (because consensus was met in the previous call already)
  //   }
  //   assert.equal(await config.flightSuretyData.isAirline.call(accounts[5], { from: config.flightSuretyApp.address }), true, "Airline 5 should be registered");
  // });

  // it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
  //   let testFlight = "Test Flight";
  //   try {
  //     await config.flightSuretyApp.registerFlight(testFlight, { from: accounts[5] });
  //   } catch (e) { }
  //   assert.equal(await config.flightSuretyApp.isFlightRegistered.call(testFlight), false, "The flight should not be registered");

  //   await config.flightSuretyApp.fund({ from: accounts[5], value: Web3.utils.toWei('10', 'ether') });
  //   await config.flightSuretyApp.registerFlight(testFlight, { from: accounts[5] });
  //   assert.equal(await config.flightSuretyApp.isFlightRegistered.call(testFlight), true, "The flight should be registered");
  // });

  // it('Passenger may pay up to 1 ether for purchasing flight insurance', async () => {
  //   let flight = "ND0001";
  //   let passenger = accounts[6];
  //   let airline = accounts[2];
  //   await config.flightSuretyApp.registerFlight(flight, {from: airline});
  //   try {
  //     await config.flightSuretyApp.buy(airline, flight, { from: passenger, value: Web3.utils.toWei('2', 'ether') });
  //   } catch (e) {
  //     // console.log(e);
  //     // This should fail on modifier: Too high insurance value
  //   }
  //   await config.flightSuretyApp.buy(airline, flight, { from: passenger, value: Web3.utils.toWei('1', 'ether') });

  //   assert.equal(await config.flightSuretyData.getFlightInsurance(passenger, flight, { from: config.flightSuretyApp.address }), Web3.utils.toWei('1', 'ether'), "Passenger should buy insurance up to 1 ether");
  // });

  // it('If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid', async () => {
  //   let flight = "ND0001";
  //   let passenger = accounts[6];
  //   let airline = accounts[2];
  //   let timestamp = Math.floor(Date.now() / 1000);
  //   let insuranceValue = await config.flightSuretyData.getFlightInsurance(passenger, flight, { from: config.flightSuretyApp.address });
  //   await config.flightSuretyApp.processFlightStatus(airline, flight, timestamp, STATUS_CODE_LATE_AIRLINE);
  //   let creditValue = await config.flightSuretyData.getPassengerCredit(passenger, { from: config.flightSuretyApp.address });
  //   //console.log(`Credit: ${creditValue}, Insurance: ${insuranceValue}`);
  //   assert.equal(creditValue, insuranceValue*1.5, "Credit value should be 1.5x of insurance value");
  // });

  // it('Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout', async () => {
  //   let passenger = accounts[6];
  //   let payoutAmount = Web3.utils.toWei('1', 'ether');
  //   let creditBefore = await config.flightSuretyData.getPassengerCredit(passenger, { from: config.flightSuretyApp.address });
  //   try {
  //     await config.flightSuretyApp.pay(Web3.utils.toWei('2', 'ether'), {from: passenger});
  //   } catch (e) {
  //     // console.log(e);
  //     // This will fail with Not enough funds
  //   }
  //   await config.flightSuretyApp.pay(payoutAmount, {from: passenger});
  //   let creditAfter = await config.flightSuretyData.getPassengerCredit(passenger, { from: config.flightSuretyApp.address });
  //   assert.equal(creditAfter, creditBefore - payoutAmount, "Passenger payout was not made correctly");
  // });

});
