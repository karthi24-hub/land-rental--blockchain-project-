// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract RentalAgreement is ReentrancyGuard {
    enum State { Created, Active, Terminated, Completed }

    address payable public landlord;
    address payable public tenant;
    
    string public propertyAddress;
    uint256 public rentAmount;
    uint256 public securityDeposit;
    uint256 public leaseStartTime;
    uint256 public leaseEndTime;
    uint256 public rentDueDate;
    uint256 public gracePeriod = 3 days;
    uint256 public lateFee = 0.01 ether; // Fixed late fee

    State public state;

    event RentPaid(address indexed tenant, uint256 amount, uint256 date);
    event LateFeeApplied(address indexed tenant, uint256 amount);
    event ContractActive(uint256 startTime);
    event ContractTerminated(uint256 time);
    event SecurityDepositRefunded(address indexed tenant, uint256 amount);

    modifier onlyLandlord() {
        require(msg.sender == landlord, "Auth: Only landlord allowed");
        _;
    }

    modifier onlyTenant() {
        require(msg.sender == tenant, "Auth: Only tenant allowed");
        _;
    }

    modifier inState(State _state) {
        require(state == _state, "State: Invalid contract state");
        _;
    }

    constructor(
        address payable _tenant,
        string memory _propertyAddress,
        uint256 _rentAmount,
        uint256 _securityDeposit,
        uint256 _durationInDays
    ) {
        landlord = payable(msg.sender);
        tenant = _tenant;
        propertyAddress = _propertyAddress;
        rentAmount = _rentAmount;
        securityDeposit = _securityDeposit;
        state = State.Created;
        leaseStartTime = block.timestamp;
        leaseEndTime = block.timestamp + (_durationInDays * 1 days);
        rentDueDate = block.timestamp + 30 days;
    }

    // Tenant confirms and pays security deposit + first month's rent
    function confirmAgreement() external payable onlyTenant inState(State.Created) {
        require(msg.value == securityDeposit + rentAmount, "Value: Must pay exactly deposit + 1st month rent");
        state = State.Active;
        // Transfer the first month's rent to landlord immediately, keep deposit in escrow
        landlord.transfer(rentAmount);
        emit ContractActive(block.timestamp);
    }

    function payRent() external payable onlyTenant inState(State.Active) nonReentrant {
        require(block.timestamp <= leaseEndTime, "Lease has ended");
        
        uint256 totalToPay = rentAmount;
        if (block.timestamp > rentDueDate + gracePeriod) {
            totalToPay += lateFee;
            emit LateFeeApplied(tenant, lateFee);
        }

        require(msg.value >= totalToPay, "Insufficient rent amount");
        
        landlord.transfer(msg.value);
        rentDueDate += 30 days;
        
        emit RentPaid(tenant, msg.value, block.timestamp);
    }

    function terminateContract() external onlyLandlord inState(State.Active) {
        state = State.Terminated;
        uint256 refundAmount = address(this).balance; 
        if (refundAmount > 0) {
            tenant.transfer(refundAmount);
            emit SecurityDepositRefunded(tenant, refundAmount);
        }
        emit ContractTerminated(block.timestamp);
    }

    function completeContract() external onlyLandlord inState(State.Active) {
        require(block.timestamp >= leaseEndTime, "Lease has not ended yet");
        state = State.Completed;
        uint256 refundAmount = address(this).balance;
        if (refundAmount > 0) {
            tenant.transfer(refundAmount);
            emit SecurityDepositRefunded(tenant, refundAmount);
        }
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
