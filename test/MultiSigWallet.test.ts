import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MultiSigWallet } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MultiSigWallet", function () {
  let wallet: MultiSigWallet;
  let owner1: SignerWithAddress, owner2: SignerWithAddress, owner3: SignerWithAddress;
  let nonOwner: SignerWithAddress, newOwner: SignerWithAddress;
  const REQUIRED_CONFIRMATIONS = 2;

  async function deployMultiSigWalletFixture() {
    [owner1, owner2, owner3, nonOwner, newOwner] = await ethers.getSigners();
    
    const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWalletFactory.deploy(
      [owner1.address, owner2.address, owner3.address],
      REQUIRED_CONFIRMATIONS
    );

    return { wallet, owner1, owner2, owner3, nonOwner, newOwner };
  }

  describe("Requirement 1: Deployment and Initialization", function () {
    it("Should deploy with initial owners and required confirmations", async function () {
      const { wallet, owner1, owner2, owner3 } = await loadFixture(deployMultiSigWalletFixture);

      const owners = await wallet.getOwners();
      expect(owners).to.have.lengthOf(3);
      expect(owners).to.include(owner1.address);
      expect(owners).to.include(owner2.address);
      expect(owners).to.include(owner3.address);

      const required = await wallet.required();
      expect(required).to.equal(2);
    });

    it("Should fail if required is 0", async function () {
      const [owner1, owner2] = await ethers.getSigners();
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");

      await expect(
        MultiSigWalletFactory.deploy([owner1.address, owner2.address], 0)
      ).to.be.revertedWith("Invalid required confirmations");
    });

    it("Should fail if required is greater than number of owners", async function () {
      const [owner1, owner2] = await ethers.getSigners();
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");

      await expect(
        MultiSigWalletFactory.deploy([owner1.address, owner2.address], 3)
      ).to.be.revertedWith("Invalid required confirmations");
    });

    it("Should fail if owners array is empty", async function () {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");

      await expect(
        MultiSigWalletFactory.deploy([], 1)
      ).to.be.revertedWith("Owners required");
    });
  });

  describe("Requirement 2: Submit ETH Transaction Proposal", function () {
    it("Should allow owner to submit ETH transfer proposal", async function () {
      const { wallet, owner1, nonOwner } = await loadFixture(deployMultiSigWalletFixture);
      
      const amount = ethers.parseEther("1.0");
      
      await expect(wallet.connect(owner1).submitTransaction(nonOwner.address, amount, "0x"))
        .to.emit(wallet, "Submission")
        .withArgs(0);

      const tx = await wallet.transactions(0);
      expect(tx.destination).to.equal(nonOwner.address);
      expect(tx.value).to.equal(amount);
      expect(tx.executed).to.be.false;
    });

    it("Should revert if non-owner tries to submit transaction", async function () {
      const { wallet, nonOwner } = await loadFixture(deployMultiSigWalletFixture);
      
      await expect(
        wallet.connect(nonOwner).submitTransaction(nonOwner.address, 0, "0x")
      ).to.be.revertedWith("Not an owner");
    });
  });

  describe("Requirement 3: Submit ERC-20 Transfer Proposal", function () {
    it("Should allow submitting ERC-20 transfer proposal with encoded data", async function () {
      const { wallet, owner1 } = await loadFixture(deployMultiSigWalletFixture);
      
      // Deploy a mock ERC-20 token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("MockToken", "MTK", ethers.parseEther("1000"));
      
      // Transfer tokens to wallet
      await token.transfer(wallet.target, ethers.parseEther("100"));

      // Encode transfer function call
      const recipient = owner1.address;
      const amount = ethers.parseEther("10");
      const data = token.interface.encodeFunctionData("transfer", [recipient, amount]);

      await expect(wallet.connect(owner1).submitTransaction(token.target, 0, data))
        .to.emit(wallet, "Submission")
        .withArgs(0);

      const tx = await wallet.transactions(0);
      expect(tx.destination).to.equal(token.target);
      expect(tx.value).to.equal(0);
      expect(tx.data).to.equal(data);
    });
  });

  describe("Requirement 4: Confirm Transaction", function () {
    it("Should allow owner to confirm transaction", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner2.address, 0, "0x");

      await expect(wallet.connect(owner2).confirmTransaction(0))
        .to.emit(wallet, "Confirmation")
        .withArgs(owner2.address, 0);

      expect(await wallet.confirmations(0, owner2.address)).to.be.true;
    });

    it("Should prevent same owner from confirming twice", async function () {
      const { wallet, owner1 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner1.address, 0, "0x");
      await wallet.connect(owner1).confirmTransaction(0);

      await expect(
        wallet.connect(owner1).confirmTransaction(0)
      ).to.be.revertedWith("Transaction already confirmed");
    });

    it("Should prevent non-owner from confirming", async function () {
      const { wallet, owner1, nonOwner } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner1.address, 0, "0x");

      await expect(
        wallet.connect(nonOwner).confirmTransaction(0)
      ).to.be.revertedWith("Not an owner");
    });
  });

  describe("Requirement 5: Execute Transaction", function () {
    it("Should execute transaction with sufficient confirmations", async function () {
      const { wallet, owner1, owner2, owner3, nonOwner } = await loadFixture(deployMultiSigWalletFixture);
      
      const amount = ethers.parseEther("1.0");
      
      // Fund wallet
      await owner1.sendTransaction({ to: wallet.target, value: amount });

      // Submit and confirm
      await wallet.connect(owner1).submitTransaction(nonOwner.address, amount, "0x");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      const beforeBalance = await ethers.provider.getBalance(nonOwner.address);
      
      await expect(wallet.connect(owner3).executeTransaction(0))
        .to.emit(wallet, "ExecutionSuccess")
        .withArgs(0);

      const afterBalance = await ethers.provider.getBalance(nonOwner.address);
      expect(afterBalance - beforeBalance).to.equal(amount);

      const tx = await wallet.transactions(0);
      expect(tx.executed).to.be.true;
    });

    it("Should fail to execute without sufficient confirmations", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner2.address, 0, "0x");

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("Not enough confirmations");
    });

    it("Should emit ExecutionFailure if underlying transaction fails", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      // Submit transaction with insufficient funds
      const amount = ethers.parseEther("100");
      await wallet.connect(owner1).submitTransaction(owner2.address, amount, "0x");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionFailure")
        .withArgs(0);

      const tx = await wallet.transactions(0);
      expect(tx.executed).to.be.false;
    });
  });

  describe("Requirement 6: Revoke Confirmation", function () {
    it("Should allow owner to revoke confirmation", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner2.address, 0, "0x");
      await wallet.connect(owner1).confirmTransaction(0);

      await expect(wallet.connect(owner1).revokeConfirmation(0))
        .to.emit(wallet, "Revocation")
        .withArgs(owner1.address, 0);

      expect(await wallet.confirmations(0, owner1.address)).to.be.false;
    });

    it("Should prevent revoking after execution", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner2.address, 0, "0x");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      await expect(
        wallet.connect(owner1).revokeConfirmation(0)
      ).to.be.revertedWith("Transaction already executed");
    });
  });

  describe("Requirement 7: Add Owner via Multi-Sig Proposal", function () {
    it("Should add a new owner through multi-sig proposal", async function () {
      const { wallet, owner1, owner2, newOwner } = await loadFixture(deployMultiSigWalletFixture);

      const data = wallet.interface.encodeFunctionData("addOwner", [newOwner.address]);

      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionSuccess")
        .withArgs(0)
        .and.to.emit(wallet, "OwnerAdded")
        .withArgs(newOwner.address);

      const owners = await wallet.getOwners();
      expect(owners).to.include(newOwner.address);
      expect(await wallet.isOwner(newOwner.address)).to.be.true;
    });

    it("Should fail if addOwner is called directly", async function () {
      const { wallet, owner1, newOwner } = await loadFixture(deployMultiSigWalletFixture);

      await expect(
        wallet.connect(owner1).addOwner(newOwner.address)
      ).to.be.revertedWith("Only wallet can call this");
    });
  });

  describe("Requirement 8: Remove Owner via Multi-Sig Proposal", function () {
    it("Should remove an owner through multi-sig proposal", async function () {
      const { wallet, owner1, owner2, owner3 } = await loadFixture(deployMultiSigWalletFixture);

      const data = wallet.interface.encodeFunctionData("removeOwner", [owner3.address]);

      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionSuccess")
        .withArgs(0)
        .and.to.emit(wallet, "OwnerRemoved")
        .withArgs(owner3.address);

      const owners = await wallet.getOwners();
      expect(owners).to.not.include(owner3.address);
      expect(await wallet.isOwner(owner3.address)).to.be.false;
    });

    it("Should adjust requirement if removing owner makes it invalid", async function () {
      const { wallet, owner1, owner2, owner3 } = await loadFixture(deployMultiSigWalletFixture);

      // Remove owner3 (leaves 2 owners, requirement is 2)
      const data = wallet.interface.encodeFunctionData("removeOwner", [owner3.address]);
      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      // Requirement should still be valid
      const required = await wallet.required();
      expect(required).to.equal(2);
    });

    it("Should fail if removeOwner is called directly", async function () {
      const { wallet, owner1, owner3 } = await loadFixture(deployMultiSigWalletFixture);

      await expect(
        wallet.connect(owner1).removeOwner(owner3.address)
      ).to.be.revertedWith("Only wallet can call this");
    });
  });

  describe("Requirement 9: Change Requirement via Multi-Sig Proposal", function () {
    it("Should change requirement through multi-sig proposal", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      const newRequirement = 3;
      const data = wallet.interface.encodeFunctionData("changeRequirement", [newRequirement]);

      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionSuccess")
        .withArgs(0)
        .and.to.emit(wallet, "RequirementChanged")
        .withArgs(newRequirement);

      expect(await wallet.required()).to.equal(newRequirement);
    });

    it("Should fail if new requirement is 0", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      const data = wallet.interface.encodeFunctionData("changeRequirement", [0]);
      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionFailure")
        .withArgs(0);
    });

    it("Should fail if new requirement is greater than number of owners", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      const data = wallet.interface.encodeFunctionData("changeRequirement", [5]);
      await wallet.connect(owner1).submitTransaction(wallet.target, 0, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionFailure")
        .withArgs(0);
    });

    it("Should fail if changeRequirement is called directly", async function () {
      const { wallet, owner1 } = await loadFixture(deployMultiSigWalletFixture);

      await expect(
        wallet.connect(owner1).changeRequirement(3)
      ).to.be.revertedWith("Only wallet can call this");
    });
  });

  describe("Requirement 10: Event Emissions", function () {
    it("Should emit Deposit event when receiving ETH", async function () {
      const { wallet, owner1 } = await loadFixture(deployMultiSigWalletFixture);
      
      const amount = ethers.parseEther("1.0");
      
      await expect(owner1.sendTransaction({ to: wallet.target, value: amount }))
        .to.emit(wallet, "Deposit")
        .withArgs(owner1.address, amount, amount);
    });

    it("Should emit all required events for complete transaction flow", async function () {
      const { wallet, owner1, owner2, nonOwner } = await loadFixture(deployMultiSigWalletFixture);
      
      // Fund wallet
      await owner1.sendTransaction({ to: wallet.target, value: ethers.parseEther("1.0") });

      // Submit
      await expect(wallet.connect(owner1).submitTransaction(nonOwner.address, ethers.parseEther("0.5"), "0x"))
        .to.emit(wallet, "Submission");

      // Confirm
      await expect(wallet.connect(owner1).confirmTransaction(0))
        .to.emit(wallet, "Confirmation");
      
      await expect(wallet.connect(owner2).confirmTransaction(0))
        .to.emit(wallet, "Confirmation");

      // Execute
      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecutionSuccess");
    });
  });

  describe("Additional Security Tests", function () {
    it("Should prevent executing the same transaction twice", async function () {
      const { wallet, owner1, owner2 } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(owner2.address, 0, "0x");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("Transaction already executed");
    });

    it("Should handle multiple pending transactions correctly", async function () {
      const { wallet, owner1, owner2, nonOwner } = await loadFixture(deployMultiSigWalletFixture);

      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x");
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x");
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x");

      expect(await wallet.getTransactionCount()).to.equal(3);

      await wallet.connect(owner1).confirmTransaction(1);
      await wallet.connect(owner2).confirmTransaction(1);
      await wallet.connect(owner1).executeTransaction(1);

      const tx1 = await wallet.transactions(1);
      expect(tx1.executed).to.be.true;

      const tx0 = await wallet.transactions(0);
      expect(tx0.executed).to.be.false;
    });
  });
});

// Mock ERC20 contract for testing
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}
`;