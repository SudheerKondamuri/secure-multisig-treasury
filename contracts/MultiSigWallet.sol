// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    // Standardized event names for off-chain monitoring
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event Submission(uint256 indexed transactionId); //
    event Confirmation(address indexed owner, uint256 indexed transactionId); //
    event Revocation(address indexed owner, uint256 indexed transactionId); //
    event ExecutionSuccess(uint256 indexed transactionId); //
    event ExecutionFailure(uint256 indexed transactionId); //
    event OwnerAdded(address indexed owner); //
    event OwnerRemoved(address indexed owner); //
    event RequirementChanged(uint256 indexed required); //

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required; // Named specifically to match Item 1 requirement

    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
    }

    Transaction[] public transactions;
    // transactionId => owner => bool
    mapping(uint256 => mapping(address => bool)) public confirmations;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    // Critical for governance security: only the contract itself can call administrative functions
    modifier onlyWallet() {
        require(msg.sender == address(this), "Only wallet can call this");
        _;
    }

    modifier txExists(uint256 _transactionId) {
        require(_transactionId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _transactionId) {
        require(!transactions[_transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _transactionId) {
        require(!confirmations[_transactionId][msg.sender], "Transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required"); //
        require(_required > 0 && _required <= _owners.length, "Invalid required confirmations"); //

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _destination,
        uint256 _value,
        bytes calldata _data
    ) public onlyOwner {
        uint256 transactionId = transactions.length;
        transactions.push(
            Transaction({
                destination: _destination,
                value: _value,
                data: _data,
                executed: false
            })
        );
        emit Submission(transactionId); //
    }

    function confirmTransaction(uint256 _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
        notConfirmed(_transactionId)
    {
        confirmations[_transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, _transactionId); //
    }

    function revokeConfirmation(uint256 _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
    {
        require(confirmations[_transactionId][msg.sender], "Transaction not confirmed");
        confirmations[_transactionId][msg.sender] = false;
        emit Revocation(msg.sender, _transactionId); //
    }

    function executeTransaction(uint256 _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                count += 1;
            }
        }

        require(count >= required, "Not enough confirmations"); //

        Transaction storage _tx = transactions[_transactionId];
        _tx.executed = true; // Prevents re-entrancy

        (bool success, ) = _tx.destination.call{value: _tx.value}(_tx.data);

        if (success) {
            emit ExecutionSuccess(_transactionId); //
        } else {
            _tx.executed = false; // Revert state if execution fails
            emit ExecutionFailure(_transactionId); //
        }
    }

    // GOVERNANCE FUNCTIONS: Must be proposed and executed via multi-sig

    function addOwner(address _newOwner) external onlyWallet {
        require(_newOwner != address(0), "Invalid owner");
        require(!isOwner[_newOwner], "Owner already exists");
        isOwner[_newOwner] = true;
        owners.push(_newOwner);
        emit OwnerAdded(_newOwner);
    }

    function removeOwner(address _owner) external onlyWallet {
        require(isOwner[_owner], "Not an owner");
        isOwner[_owner] = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        if (required > owners.length) {
            changeRequirement(owners.length);
        }
        emit OwnerRemoved(_owner);
    }

    function changeRequirement(uint256 _required) public onlyWallet {
        require(_required > 0 && _required <= owners.length, "Invalid requirement");
        required = _required;
        emit RequirementChanged(_required);
    }

    // VIEW FUNCTIONS

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}