
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function (accounts) {

    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x99C11f9397684420d9F6F797D76C7CD524df13cB",
        "0x967D5781c02b3f986F5083226143044D6D2b25eC",
        "0xDbE9EC98EE71D0a9811778599B6E0AD322eb0A9F",
        "0x2b80c1826a15Cf2232E0e89D655b3576df5fF0c3",
        "0xF92320c67378cF26B95466F2b218180B3802b6DA",
        "0x6293133251a1f379253C422F66C22b13361CfDd2",
        "0x16D6898c4B2709C77D97D3087bbe18a633BaE79d",
        "0x9bb08D56A02c89A760136c7B20Ef1629B64b9153",
        "0xB7eb6128E681a7B1935EB0c5efD83C6167e4fB65"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);


    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};