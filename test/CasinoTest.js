const {web3, property, sendSignedTx, sendSignedTxSimple, evmMine, getString} = require('./contractUtil.js')

const Account = require("eth-lib/lib/account");

const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)

const reveals = ['0','1','2','3','4','5','6','7','8','9']

function getCommit(reveal) {
  return web3.utils.soliditySha3(reveal)
}

async function placeBet(value, choice, modulo, expiredBlockNumber, commit, v, r, s) {
  const data = contract.methods.placeBet(choice, modulo, expiredBlockNumber, commit, v, r, s).encodeABI()
  const nonce = await web3.eth.getTransactionCount(property.from)
  const gasPrice = await web3.eth.getGasPrice()
  const gasLimit = await web3.eth.estimateGas({from: property.from, to: contractAddr, value: value, data: data})
  await sendSignedTx(contractAddr, data, nonce, value, gasPrice, gasLimit, property.from, property.pk)
}

async function closeBet(reveal) {
  const data = contract.methods.closeBet(reveal).encodeABI()
  return await sendSignedTxSimple(contractAddr, data)
}

async function refundBet(commit) {
  const data = contract.methods.refundBet(commit).encodeABI()
  return await sendSignedTxSimple(contractAddr, data)
}

function getSignature(expiredBlockNumber, commit, pk) {
  const msgHash = web3.utils.soliditySha3(expiredBlockNumber, commit)
  const signature = Account.sign(msgHash, pk)
  const r = signature.slice(0, 66)
  const s = '0x' + signature.slice(66, 130)
  const v = signature.slice(130, 132)
  return [signature, v, r, s]
}

async function test() {

  const contBan = await web3.eth.getBalance(contractAddr)
  console.log('contract balance', contBan)
  const accBan = await web3.eth.getBalance(property.from)
  console.log('acc1 balance', accBan)

  const reveal = reveals[0]

  const value = 1e17
  const choice = '1'
  const modulo = '2'
  const expiredBlockNumber = await web3.eth.getBlockNumber() + 200

  const commit = getCommit(reveal)
  const sign = getSignature(expiredBlockNumber, commit, property.pk)

  console.log(sign[0])
  console.log(web3.utils.hexToNumber(sign[1]))

  // await placeBet(value, choice, modulo, expiredBlockNumber, commit, web3.utils.hexToNumber(sign[1]), sign[2], sign[3])

  // await closeBet(reveal).then(tx => {
  //   console.log(tx.logs)
  // })

  // await refundBet(2).then(tx => {
  //   console.log(tx.logs)
  // })

  // for (let i = 0; i < 250; i++) {
  //   await evmMine()
  // }

  // await web3.eth.getTransactionReceipt('0x3dc2a18b67e3ae93c9e996ace6910ec92950720559337d303e1d6a7c544fefc5')
  //   .then(tx => {
  //     console.log(tx.logs[1].topics[1].slice())
  //     console.log(web3.utils.hexToNumberString(tx.logs[1].data.slice(2, 66)))
  //     console.log(web3.utils.hexToNumberString(tx.logs[1].data.slice(66, 130)))
  //     console.log(web3.utils.hexToNumberString(tx.logs[1].data.slice(130, 194)))
  //     console.log(web3.utils.hexToNumberString(tx.logs[1].data.slice(194, 258)))
  //   })
  // const blockNumber = await web3.eth.getBlockNumber()
  // console.log('blockNumber', blockNumber)
  // for (let i = 0; i < blockNumber; i++) {
  //   const block = await web3.eth.getBlock(i)
  //   console.log(block.miner, block.timestamp)
  // }


}

test()
