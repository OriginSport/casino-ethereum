const {web3, property, sendSignedTx, sendSignedTxSimple} = require('./contractUtil.js')


const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)

async function getBetNonce() {
  return await contract.methods.betNonce().call()
}

async function placeBet(value, choice, modulo, expiredBlockNumber) {
  const data = contract.methods.placeBet(choice, modulo, expiredBlockNumber).encodeABI()
  const nonce = await web3.eth.getTransactionCount(property.from)
  const gasPrice = await web3.eth.getGasPrice()
  const gasLimit = await web3.eth.estimateGas({from: property.from, to: contractAddr, value: value, data: data})
  await sendSignedTx(contractAddr, data, nonce, value, gasPrice, gasLimit, property.from, property.pk)
}

async function closeBet(betNonce) {
  const data = contract.methods.closeBet(betNonce).encodeABI()
  await sendSignedTxSimple(contractAddr, data)
}

async function test() {

  const contBan = await web3.eth.getBalance(contractAddr)
  console.log('contract balance', contBan)
  const accBan = await web3.eth.getBalance(property.from)
  console.log('acc1 balance', accBan)

  await getBetNonce().then(data => {
    console.log('betNonce', data)
  })

  const value = 1e17
  const choice = '1'
  const modulo = '2'
  const expiredBlockNumber = await web3.eth.getBlockNumber() + 200

  await placeBet(value, choice, modulo, expiredBlockNumber)

  await closeBet(0).then(tx => {
    console.log(tx.logs)
  })

  // await web3.eth.getTransactionReceipt('0x2bfb9e4d8cd69baa88f572416a7227af7a22e67e455c6ed2d7fec878d33745fc')
  //     .then(tx => {
  //         console.log(tx.logs)
  //     })
}

test()