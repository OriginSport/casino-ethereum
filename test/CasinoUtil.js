const web3 = require('web3')

const BigNumber = require('bignumber.js')

function closeBet(reveal, blockHash, module) {
  const random = new BigNumber(web3.utils.soliditySha3(reveal, blockHash))
  const result = random.modulo(module)
  return{random: random.toString(16), result: result.toString()}
}

const reveal = '0x' + '000000000000000000000000000000000000000000000000000ddee4def596f7'
const commit = web3.utils.sha3(reveal)
const blockHash = '0xac62d92f3c1eec9b2574db3a06c6b3cba28628bc4bb47b640e72515eaa9d65d3'
console.log(commit)
console.log(closeBet(reveal, blockHash, 2))
