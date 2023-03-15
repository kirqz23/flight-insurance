// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract FlightSuretyData {

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational; // Blocks all state changes throughout the contract if false
    mapping(address => uint256) private funds;

    mapping(address => bool) private authorizedCallers;

    struct Airline {
        string name;
        bool isRegistered;
        bool isFunded;
    }

    mapping(address => Airline) private airlines;
    mapping(string => address) private airlineNames;
    uint256 private numAirlinesRegistered;
    uint256 private numAirlinesFunded;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(string => Flight) private flights;

    mapping(bytes32 => uint256) private insurances;
    mapping(string => address[]) private flightInsurees;

    mapping(address => uint256) private credits;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
        operational = true;
        registerAirline(msg.sender, "AIR1");
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthCaller() {
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view requireAuthCaller returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool _mode) external requireContractOwner {
        operational = _mode;
    }

    function authorizeCaller(
        address _authAddress
    ) external requireContractOwner {
        authorizedCallers[_authAddress] = true;
    }

    function deauthorizeCaller(
        address _authAddress
    ) external requireContractOwner {
        delete authorizedCallers[_authAddress];
    }

    function isAirline(
        address _airline
    ) external view requireIsOperational requireAuthCaller returns (bool) {
        return airlines[_airline].isRegistered;
    }

    function isAirlineFunded(
        address _airline
    ) external view requireIsOperational requireAuthCaller returns (bool) {
        return airlines[_airline].isFunded;
    }

    function isFlightRegistered(
        string memory _flight
    ) external view requireIsOperational requireAuthCaller returns (bool) {
        return flights[_flight].isRegistered;
    }

    function getAirlinesRegistered()
        external
        view
        requireAuthCaller
        returns (uint256)
    {
        return numAirlinesRegistered;
    }

    function getAirlinesFunded()
        external
        view
        requireAuthCaller
        returns (uint256)
    {
        return numAirlinesFunded;
    }

    function getFlightAirline(
        string memory _name
    ) external view requireAuthCaller returns (address) {
        return flights[_name].airline;
    }

    function getFlightInsurance(
        address _passenger,
        string memory _flight
    ) external view requireAuthCaller returns (uint256) {
        bytes32 insurance = keccak256(abi.encodePacked(_passenger, _flight));
        return insurances[insurance];
    }

    function getFlightInsurees(
        string memory _flight
    ) external view requireAuthCaller returns (address[] memory) {
        return flightInsurees[_flight];
    }

    function getPassengerCredit(
        address _passenger
    ) external view requireAuthCaller returns (uint256) {
        return credits[_passenger];
    }

    function getAirline(
        address _airline
    ) external view requireAuthCaller returns (Airline memory){
        return airlines[_airline];
    }

    function getAirlineAddress(
        string memory _name
    ) external view requireAuthCaller returns (address) {
        return airlineNames[_name];
    }

    function getFlight(
        string memory _flight
    ) external view requireAuthCaller returns (Flight memory) {
        return flights[_flight];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(
        address _newAirline,
        string memory _name
    ) public requireIsOperational requireAuthCaller {
        require(
            !airlines[_newAirline].isRegistered,
            "Airline is already registered"
        );
        require(
            airlineNames[_name] == address(0), "Airline with such name already exits"
        );

        airlines[_newAirline] = Airline({name: _name, isRegistered: true, isFunded: false});
        airlineNames[_name] = _newAirline;
        numAirlinesRegistered += 1;
    }

    function registerFlight(
        string memory _name,
        address _airlineAddress,
        uint8 _status
    ) external requireIsOperational requireAuthCaller {
        require(!flights[_name].isRegistered, "Flight was already registered");
        flights[_name] = Flight({
            isRegistered: true,
            statusCode: _status,
            updatedTimestamp: block.timestamp,
            airline: _airlineAddress
        });
    }

    function updateFlightStatus(
        string memory _name,
        uint8 _status,
        uint256 timestamp
    ) external requireIsOperational requireAuthCaller {
        require(flights[_name].isRegistered, "Flight is not registered");
        flights[_name].statusCode = _status;
        flights[_name].updatedTimestamp = timestamp;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        address _passenger,
        string memory _flight
    ) external payable requireIsOperational requireAuthCaller {
        bytes32 insurance = keccak256(abi.encodePacked(_passenger, _flight));
        require(
            insurances[insurance] == 0,
            "Insurance for the flight was already bought"
        );
        insurances[insurance] = msg.value;
        flightInsurees[_flight].push(_passenger);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsuree(
        address _passenger,
        string memory _flight,
        uint256 _value
    ) external requireAuthCaller requireIsOperational {
        bytes32 insurance = keccak256(abi.encodePacked(_passenger, _flight));
        require(insurances[insurance] > 0, "Insurance is not active");
        credits[_passenger] += _value;
        delete insurances[insurance];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(
        address _passenger,
        uint256 _value
    ) external requireAuthCaller requireIsOperational {
        require(_value <= credits[_passenger], "Not enough funds!");
        require(
            !airlines[_passenger].isRegistered,
            "Airlines are not allowed to payout!"
        );
        credits[_passenger] -= _value;
        payable(_passenger).transfer(_value);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(
        address _airline
    ) public payable requireIsOperational requireAuthCaller {
        funds[_airline] = msg.value;
        airlines[_airline].isFunded = true;
        numAirlinesFunded += 1;
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund(tx.origin);
    }

    receive() external payable {
        fund(tx.origin);
    }
}
