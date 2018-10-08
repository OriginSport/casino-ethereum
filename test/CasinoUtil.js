const web3 = require('web3')

const BigNumber = require('bignumber.js')

function closeBet(reveal, blockHash, module) {
  const random = new BigNumber(web3.utils.soliditySha3(reveal, blockHash))
  const result = random.modulo(module)
  return{random: random.toString(16), result: result.toString()}
}


function odds(_amount, _choice, _modulo) {
  const HOUSE_EDGE_PERCENT = 1
  const HOUSE_EDGE_MINIMUM_AMOUNT = 300000000000000

  // population count
  const POPCOUNT_MULT = new BigNumber(0x0000000000002000000000100000000008000000000400000000020000000001)
  const POPCOUNT_MASK = new BigNumber(0x0001041041041041041041041041041041041041041041041041041041041041)
  const POPCOUNT_MODULO = 0x3F

  console.log(POPCOUNT_MULT, POPCOUNT_MASK, POPCOUNT_MODULO)

  let houseEdge = new BigNumber(_amount).multipliedBy(HOUSE_EDGE_PERCENT).dividedBy(100)
  if (houseEdge < HOUSE_EDGE_MINIMUM_AMOUNT) {
    houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
    console.log('if true')
  }
  console.log('houseEdge', houseEdge)

  let populationCount
  if (_modulo < 40) {
    const m = POPCOUNT_MULT.multipliedBy(_choice)
    const mm = new BigNumber(POPCOUNT_MULT.multipliedBy(_choice) & POPCOUNT_MASK)
    populationCount = new BigNumber(POPCOUNT_MULT.multipliedBy(_choice) & POPCOUNT_MASK).modulo(POPCOUNT_MODULO)
    console.log(m, mm, populationCount)
  } else {
    populationCount = _choice
  }

  const winAmount = (_amount - houseEdge) * _modulo / populationCount
  const odds = winAmount / _amount
  const winChance = populationCount / _modulo
  return {winAmount, odds, winChance}
}

console.log(odds(1000000000000000000, 1, 2))