pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './HouseAdmin.sol';

contract Casino is Ownable, HouseAdmin {
  using SafeMath for uint;

  uint constant HOUSE_EDGE_PERCENT = 2;
  uint constant HOUSE_EDGE_MINIMUM_AMOUNT = 0.0003 ether;

  uint constant BET_AMOUNT_MIN = 0.01 ether;
  uint constant BET_AMOUNT_MAX = 1000 ether;

  uint constant BET_EXPIRATION_BLOCKS = 250;

  uint public bankFund;

  struct Bet {
    uint8 choice;
    uint8 modulo;
    uint  amount;
    uint  winAmount;
    uint  placeBlockNumber;
    address player;
    bool isActive;
  }

  mapping (uint => Bet) bets;

  event LogParticipant(address indexed player, uint indexed modulo, uint choice, uint amount, uint commit);
  event LogClosedBet(address indexed player, uint indexed modulo, uint choice, uint reveal, uint result, uint amount, uint winAmount);
  event LogDistributeReward(address indexed addr, uint reward);
  event LogRecharge(address indexed addr, uint amount);
  event LogRefund(address indexed addr, uint amount);

  constructor() payable public {
    owner = msg.sender;
  }

  function placeBet(uint _choice, uint _modulo, uint _expiredBlockNumber, uint _commit, uint8 _v, bytes32 _r, bytes32 _s) payable external {
    Bet storage bet = bets[_commit];

    uint amount = msg.value;

    require(bet.player == address(0), "this bet is already exist");
    require(block.number < _expiredBlockNumber, 'this bet has expired');
    require(amount > BET_AMOUNT_MIN && amount < BET_AMOUNT_MAX, 'bet amount out of range');

    // verify the signer and _expiredBlockNumber
    bytes32 msgHash = keccak256(abi.encodePacked(_expiredBlockNumber, _commit));
    require(ecrecover(msgHash, _v, _r, _s) == signer, "incorrect signer");

    uint houseEdge = amount * HOUSE_EDGE_PERCENT / 100;
    if (houseEdge < HOUSE_EDGE_MINIMUM_AMOUNT) {
      houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
    }

    uint winAmount = (amount - houseEdge) * _modulo;
    // lock winAmount into this contract. Make sure contract is solvent
    bankFund = bankFund.add(winAmount);

    require(bankFund <= address(this).balance, 'contract balance is not enough');

    bet.choice = uint8(_choice);
    bet.player = msg.sender;
    bet.placeBlockNumber = block.number;
    bet.amount = amount;
    bet.winAmount = winAmount;
    bet.isActive = true;
    bet.modulo = uint8(_modulo);

    emit LogParticipant(msg.sender, _modulo, _choice, amount, _commit);
  }

  function closeBet(uint _reveal) external onlyCroupier {
    uint commit = uint(keccak256(abi.encodePacked(_reveal)));
    Bet storage bet = bets[commit];

    require(bet.isActive, 'this bet is not active');

    uint amount = bet.amount;
    uint placeBlockNumber = bet.placeBlockNumber;
    uint modulo = bet.modulo;
    uint winAmount = 0;
    uint choice = bet.choice;
    address player = bet.player;

    require(block.number > placeBlockNumber, 'close bet block number is too low');
    require(block.number <= placeBlockNumber + BET_EXPIRATION_BLOCKS, 'the block number is too low to query');

    uint result = uint(keccak256(abi.encodePacked(_reveal, blockhash(placeBlockNumber)))) % modulo;

    if (choice == result) {
      winAmount = bet.winAmount;
      player.transfer(winAmount);
      emit LogDistributeReward(player, winAmount);
    }
    // release winAmount deposit
    bankFund -= bet.winAmount;
    bet.isActive = false;

    emit LogClosedBet(player, modulo, choice, _reveal, result, amount, winAmount);
  }

  function refundBet(uint _commit) external onlyCroupier {
    Bet storage bet = bets[_commit];

    uint amount = bet.amount;
    address player = bet.player;

    require(bet.isActive, 'this bet is not active');

    player.transfer(amount);
    // release winAmount deposit
    bankFund -= bet.winAmount;
    bet.isActive = false;

    emit LogRefund(player, amount);
  }

  /**
   * @dev in order to let more people participant
   */
  function recharge() public payable {
    emit LogRecharge(msg.sender, msg.value);
  }

  /**
   * @dev owner can withdraw the remain ether
   */
  function withdraw(uint _amount) external onlyOwner {
    require(_amount <= address(this).balance - bankFund, 'cannot withdraw amount greater than (balance - deposit)');

    owner.transfer(_amount);
  }
}
 
