pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './Signable.sol';

contract Casino is Ownable, Signable {

  uint constant HOUSE_EDGE_PERCENT = 2;
  uint constant HOUSE_EDGE_MINIMUM_AMOUNT = 0.0003 ether;

  uint constant MIN_BET = 0.01 ether;
  uint constant MAX_AMOUNT = 1000 ether;
  uint public betNonce = 0;

  struct Bet {
    uint8 choice;
    uint8 modulo;
    uint  amount;
    uint  rewardAmount;
    uint  placeBlockNumber;
    address player;
  }
  mapping (uint => Bet) bets;

  event LogParticipant(address indexed player);

  constructor() public {
    owner = msg.sender;
  }

  function placeBet(uint _choice, uint _modulo, uint _expiredBlockNumber) payable external {
    Bet bet = bets[betNonce];

    uint amount = msg.value;

    require(block.number < _expiredBlockNumber, "this bet has expired");
    require(amount > BET_AMOUNT_MIN && amount < BET_AMOUNT_MAX, "bet amount out of range");

    uint houseEdge = amount * HOUSE_EDGE_PERCENT / 100;

    if (houseEdge < HOUSE_EDGE_MINIMUM_AMOUNT) {
      houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
    }

    rewardAmount = (amount - houseEdge) * modulo;

    bet.choice = _choice
    bet.player = msg.sender;
    bet.placeBlockNumber = block.number;
    bet.amount = amount;
    bet.rewardAmount = rewardAmount;
    bet.modulo = uint8(_modulo);

    betNonce += 1;
  }
}
 
