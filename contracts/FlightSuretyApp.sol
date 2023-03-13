// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    uint256 private constant AIRLINE_FUND = 10 ether;
    uint256 private constant PASSANGER_MAX_INSURANCE = 1 ether;

    uint8 private constant AIRLINES_MIN_COUNT = 4;
    mapping(address => address[]) private multiCalls;

    address private contractOwner; // Account used to deploy contract
    FlightSuretyData private dataContract;

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
        require(
            isOperational() == true,
            "Contract is currently not operational"
        );
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the "Airline" account to be the function caller
     */
    modifier requireAirline(address _address) {
        require(
            dataContract.isAirline(_address) ||
                (dataContract.getAirlinesRegistered() == 0 &&
                    msg.sender == contractOwner),
            "Caller is not an Airline (Contract owner can register only first Airline)"
        );
        _;
    }

    modifier requireFundedAirline(address _address) {
        require(
            dataContract.isAirlineFunded(_address),
            "Airline is not funded"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address _dataContract) {
        contractOwner = msg.sender;
        dataContract = FlightSuretyData(payable(_dataContract));
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return dataContract.isOperational();
    }

    function isFlightRegistered(
        string memory _flight
    ) public view returns (bool) {
        return dataContract.isFlightRegistered(_flight);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(
        address _newAirline
    )
        external
        requireIsOperational
        requireAirline(msg.sender)
        returns (bool success, uint256 votes)
    {
        if (dataContract.getAirlinesRegistered() > 0) {
            require(
                dataContract.isAirlineFunded(msg.sender),
                "Airline is not funded"
            );
        }

        if (dataContract.getAirlinesRegistered() < AIRLINES_MIN_COUNT) {
            dataContract.registerAirline(_newAirline);
            success = true;
            votes = 0;
        } else {
            bool isDuplicate = false;
            for (uint256 c = 0; c < multiCalls[_newAirline].length; c++) {
                if (multiCalls[_newAirline][c] == msg.sender) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Caller has already voted!");

            multiCalls[_newAirline].push(msg.sender);
            if (
                multiCalls[_newAirline].length >=
                dataContract.getAirlinesRegistered() / 2
            ) {
                dataContract.registerAirline(_newAirline);
                success = true;
            } else {
                success = false;
            }
            votes = multiCalls[_newAirline].length;
        }

        return (success, votes);
    }

    function fund()
        external
        payable
        requireIsOperational
        requireAirline(msg.sender)
    {
        require(msg.value >= AIRLINE_FUND, "Not enough funds sent!");
        require(
            !dataContract.isAirlineFunded(msg.sender),
            "Airline is already funded!"
        );
        dataContract.fund{value: msg.value}(msg.sender);
    }

    function buy(
        address _airline,
        string memory _flight
    ) external payable requireIsOperational requireFundedAirline(_airline) {
        require(
            msg.value <= PASSANGER_MAX_INSURANCE,
            "Too high insurance value!"
        );
        require(
            dataContract.getFlightAirline(_flight) == _airline,
            "Flight is not registered for this airline!"
        );

        dataContract.buy{value: msg.value}(msg.sender, _flight);
    }

    function pay(uint256 _value) external requireIsOperational {
        dataContract.pay(msg.sender, _value);
    }

    function creditInsurees(
        string memory _flight
    ) internal requireIsOperational {
        address[] memory insurees = dataContract.getFlightInsurees(_flight);
        for (uint i = 0; i < insurees.length; i++) {
            uint256 value = dataContract.getFlightInsurance(
                insurees[i],
                _flight
            );
            uint256 creditValue = value + value / 2;
            dataContract.creditInsuree(insurees[i], _flight, creditValue);
        }
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(
        string memory _name
    ) external requireIsOperational requireFundedAirline(msg.sender) {
        dataContract.registerFlight(_name, msg.sender, STATUS_CODE_UNKNOWN);
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) public requireIsOperational {
        require(statusCode != STATUS_CODE_UNKNOWN, "Flight status UNKNOWN");
        require(
            dataContract.getFlightAirline(flight) == airline,
            "No flight for such airline"
        );

        dataContract.updateFlightStatus(flight, statusCode, timestamp);

        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(flight);
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );

        oracleResponses[key].requester = msg.sender;
        oracleResponses[key].isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(
        address account
    ) internal returns (uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}
