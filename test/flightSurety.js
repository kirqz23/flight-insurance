
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    await config.flightSuretyApp.registerAirline(config.firstAirline, {value: 1});
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('First airline is registered when contract is deployed.', async () => {
    let result = await config.flightSuretyData.isAirline(config.firstAirline); 
    assert.equal(result, true, config.firstAirline + " should be already registered");
  });

  it('Only existing airline may register a new airline until there are at least four airlines registered', async () => {
    let newAirline = accounts[2];

    // ACT
    await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline, value: 1});
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");
  });


  it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
    await config.flightSuretyApp.registerAirline(accounts[3], {from: config.firstAirline, value: 1});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[3]), true, "Airline 3 should be registered");
    await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline, value: 1});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[4]), true, "Airline 4 should be registered");

    await config.flightSuretyApp.registerAirline(accounts[5], {from: config.firstAirline, value: 1});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[5]), false, "Airline 5 should still not be registered");

    await config.flightSuretyApp.registerAirline(accounts[5], {from: accounts[2], value: 1});
    await config.flightSuretyApp.registerAirline(accounts[5], {from: accounts[3], value: 1});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[5]), true, "Airline 5 should be registered");
  });
  
  it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
    let testFlight = "Test Flight";
    try {
        await config.flightSuretyApp.registerFlight(accounts[5], testFlight, {from: accounts[5]});
    } catch(e) {}
    assert.equal(await config.flightSuretyApp.isFlightRegistered.call(testFlight), false, "The flight should not be registered");

    await config.flightSuretyApp.fund(accounts[5], {from: accounts[5], value: Web3.utils.toWei('10', 'ether')});
    await config.flightSuretyApp.registerFlight(accounts[5], testFlight, {from: accounts[5]});
    assert.equal(await config.flightSuretyApp.isFlightRegistered.call(testFlight), true, "The flight should be registered");
  });
});
