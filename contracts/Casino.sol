pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './Signable.sol';

contract Casino is Ownable, Signable {

  uint constant HOUSE_EDGE_PERCENT = 2;
  uint constant HOUSE_EDGE_MINIMUM_AMOUNT = 0.0003 ether;

  uint constant MIN_BET = 0.01 ether;
  uint constant MAX_AMOUNT = 1000 ether;

  uint constant BET_EXPIRATION_BLOCKS = 250;

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
  event LogDistributeReward(address indexed addr, uint reward);

  constructor() public {
    owner = msg.sender;
  }

  function placeBet(uint _choice, uint _modulo, uint _expiredBlockNumber) payable external {
    Bet bet = bets[betNonce];

    uint amount = msg.value;

    require(block.number < _expiredBlockNumber, 'this bet has expired');
    require(amount > BET_AMOUNT_MIN && amount < BET_AMOUNT_MAX, 'bet amount out of range');

    uint houseEdge = amount * HOUSE_EDGE_PERCENT / 100;

    if (houseEdge < HOUSE_EDGE_MINIMUM_AMOUNT) {
      houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
    }

    winAmount = (amount - houseEdge) * modulo;

    bet.choice = _choice
    bet.player = msg.sender;
    bet.placeBlockNumber = block.number;
    bet.amount = amount;
    bet.winAmount = winAmount;
    bet.modulo = uint8(_modulo);

    betNonce += 1;
  }

  function closeBet(uint _betNonce) external onlyOwner {
    Bet bet = bets[_betNonce];

    uint placeBlockNumber = bet.placeBlockNumber;
    uint modulo = bet.modulo;
    uint winAmount = bet.winAmount;
    uint choice = bet.choice;
    address player = bet.player;

    require (block.number > placeBlockNumber, 'close bet block number is too low');
    require (block.number <= placeBlockNumber + BET_EXPIRATION_BLOCKS, 'the block number is too low to query');

    uint result = uint(keccak256(now)) % modulo;

    if (choice == result) {
      player.transfer(winAmount);
      emit LogDistributeReward(player, winAmount);
    }
  }

  function refundBet(uint _betNonce) external onlyOwner {
    Bet bet = bets[_betNonce];

    uint amount = bet.amount;
    address player = bet.player;

    require (block.number <= placeBlockNumber + BET_EXPIRATION_BLOCKS, 'the block number is too low to query');

    player.transfer(amount);
  }
}
 
