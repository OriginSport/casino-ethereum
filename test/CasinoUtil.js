const web3 = require('web3')
const BN = require('bn.js')

function closeBet(reveal, blockHash, module) {
  const random = new BN(web3.utils.soliditySha3(reveal, blockHash).slice(2), 16)
  const result = random.mod(web3.utils.toBN(module))
  return{random: '0x' + random.toString(16), result: result.toString()}
}

// const reveal = '0x' + '000000000000000000000000000000000000000000000000000ddee4def596f7'
// const commit = web3.utils.sha3(reveal)
// const blockHash = '0xac62d92f3c1eec9b2574db3a06c6b3cba28628bc4bb47b640e72515eaa9d65d3'
// console.log(commit)
// console.log(closeBet(reveal, blockHash, 2))

function odds(_amount, _choice, _modulo) {
  const HOUSE_EDGE_PERCENT = new BN('1', 10)
  const HOUSE_EDGE_MINIMUM_AMOUNT = new BN('300000000000000', 10)

  // population count
  const POPCOUNT_MULT = new BN('0000000000002000000000100000000008000000000400000000020000000001', 16)
  const POPCOUNT_MASK = new BN('0001041041041041041041041041041041041041041041041041041041041041', 16)
  const POPCOUNT_MODULO = new BN('3F', 16)

  _amount = new BN(_amount, 10)
  _choice = new BN(_choice, 10)
  _modulo = new BN(_modulo, 10)
  let houseEdge = _amount.mul(HOUSE_EDGE_PERCENT).div(new BN('100', 10))
  if (houseEdge.lt(HOUSE_EDGE_MINIMUM_AMOUNT)) {
    houseEdge = HOUSE_EDGE_MINIMUM_AMOUNT;
  }

  let populationCount
  if (_modulo < 40) {
    const m = POPCOUNT_MULT.mul(_choice)
    const mm = POPCOUNT_MULT.mul(_choice).and(POPCOUNT_MASK)
    populationCount = POPCOUNT_MULT.mul(_choice).and(POPCOUNT_MASK).mod(POPCOUNT_MODULO)
  } else {
    populationCount = _choice
  }

  const winAmount = (_amount - houseEdge) * _modulo / populationCount
  const odds = winAmount / _amount
  const winChance = populationCount / _modulo
  return {winAmount, odds, winChance}
}
// console.log(odds('1000000000000000000', '31', '6'))


function choice(_choice, _times, _select) {
  let lengths = []
  let marks = []
  for (let i = 0; i < _times; i++) {
    lengths[i] = _choice
    marks[i] = 0
  }
  let strRes = []
  recurse(lengths, marks, 0, _select, strRes)
  return new BN(strRes.join(''), 2).toString(10)
}
// console.log(choice(2, 1, 2))

function recurse(_lengths, _marks, _index, _result, _strRes) {
  for (let i = 0; i < _lengths[_index]; i++) {
    _marks[_index] = i
    if (_index === _lengths.length - 1) {
      const result = arrSum(_marks, 10) + _lengths.length
      _strRes.unshift(_result === result ? 1 : 0)
    } else {
      recurse(_lengths, _marks, _index + 1, _result, _strRes)
    }
  }
}
// let strRes = []
// recurse([6,6], [0, 0], 0, 7, strRes)
// console.log(strRes.join(''))

function arrSum(arr, ns) {
  let res = new BN(0, ns)
  for (let i = 0; i < arr.length; i++) {
    res = res.add(new BN(arr[i] + '', ns))
  }
  return res.toNumber()
}

// console.log(arrSum([10, 10], 2))

function revertChoice(_choice) {
  let result = []
  const strRes = _choice.toString(2).split('').reverse()
  for (let i = 0; i < strRes.length; i++) {
    if (strRes[i] === '1') {
      result.push(i)
    }
  }
  return result
}

console.log(revertChoice(66))
