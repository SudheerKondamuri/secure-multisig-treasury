// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;



contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event ProposalSubmitted(
        uint indexed transactionId,
        address indexed destination,
        uint value,
        bytes data
    );
    event Confirmation(address indexed owner, uint indexed transactionId);
    event Revocation(address indexed owner, uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public requiredConfirmations;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
    }

    // mapping from transactionId => Transaction
    Transaction[] public transactions;

    // mapping from transactionId => owner => bool
    mapping(uint => mapping(address => bool)) public confirmations;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint _transactionId) {
        require(_transactionId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint _transactionId) {
        require(!transactions[_transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint _transactionId) {
        require(!confirmations[_transactionId][msg.sender], "Transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint _requiredConfirmations) {
        require(_owners.length > 0, "Owners required");
        require(
            _requiredConfirmations > 0 && _requiredConfirmations <= _owners.length,
            "Invalid required confirmations"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredConfirmations = _requiredConfirmations;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _destination,
        uint _value,
        bytes memory _data
    ) public onlyOwner {
        uint transactionId = transactions.length;
        transactions.push(
            Transaction({
                destination: _destination,
                value: _value,
                data: _data,
                executed: false
            })
        );
        emit ProposalSubmitted(transactionId, _destination, _value, _data);
    }

    function confirmTransaction(uint _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
        notConfirmed(_transactionId)
    {
        confirmations[_transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, _transactionId);
    }

    function revokeConfirmation(uint _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
    {
        require(confirmations[_transactionId][msg.sender], "Transaction not confirmed by you");
        confirmations[_transactionId][msg.sender] = false;
        emit Revocation(msg.sender, _transactionId);
    }

    function executeTransaction(uint _transactionId)
        public
        onlyOwner
        txExists(_transactionId)
        notExecuted(_transactionId)
    {
        uint confirmationCount = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                confirmationCount++;
            }
        }

        require(
            confirmationCount >= requiredConfirmations,
            "Not enough confirmations"
        );

        Transaction storage _tx = transactions[_transactionId];
        _tx.executed = true;

        (bool success, ) = _tx.destination.call{value: _tx.value}(_tx.data);

        if (success) {
            emit Execution(_transactionId);
        } else {
            emit ExecutionFailure(_transactionId);
        }
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _transactionId)
        public
        view
        returns (
            address destination,
            uint value,
            bytes memory data,
            bool executed
        )
    {
        Transaction storage _tx = transactions[_transactionId];
        return (_tx.destination, _tx.value, _tx.data, _tx.executed);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }
}
