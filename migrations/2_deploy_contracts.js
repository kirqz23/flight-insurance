const flightSuretyApp = artifacts.require("FlightSuretyApp");
const flightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
    deployer.deploy(flightSuretyData)
    .then(() => {
        return deployer.deploy(flightSuretyApp(flightSuretyData.address))
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545',
                            dataAddress: flightSuretyData.address,
                            appAddress: flightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}