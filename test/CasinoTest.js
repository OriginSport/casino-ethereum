const {web3, property, sendSignedTx, sendSignedTxHelper, sendSignedTxSimple, evmMine, getString} = require('./contractUtil.js')
const {getEventLogs, getEvents, decodeLog} = require('./eventUtil')

const Account = require("eth-lib/lib/account");

const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const transactionHash = contractJson.networks[property.networkID].transactionHash
const contract = new web3.eth.Contract(contractAbi, contractAddr)

const reveals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function getCommit(reveal) {
  return web3.utils.soliditySha3(reveal)
}

async function placeBet(value, choice, modulo, expiredBlockNumber, commit, v, r, s) {
  const data = contract.methods.placeBet(choice, modulo, expiredBlockNumber, commit, v, r, s).encodeABI()
  const nonce = await web3.eth.getTransactionCount(property.from)
  const gasPrice = await web3.eth.getGasPrice()
  const gasLimit = await web3.eth.estimateGas({from: property.from, to: contractAddr, value: value, data: data})
  return await sendSignedTx(contractAddr, data, nonce, value, gasPrice, gasLimit, property.from, property.pk)
}

async function closeBet(reveal) {
  const data = contract.methods.closeBet(reveal).encodeABI()
  return await sendSignedTxSimple(contractAddr, data)
}

async function refundBet(commit) {
  const data = contract.methods.refundBet(commit).encodeABI()
  return await sendSignedTxSimple(contractAddr, data)
}

async function withdraw(amount) {
  const data = contract.methods.withdraw(amount).encodeABI()
  return await sendSignedTxSimple(contractAddr, data)
}

async function recharge(amount) {
  const data = contract.methods.recharge().encodeABI()
  return await sendSignedTxHelper(contractAddr, data, amount, property.pk)
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
  // console.log(contractJson.abi)
  const events = getEvents(contractJson.abi)
  const fromBlock = (await web3.eth.getTransaction(transactionHash)).blockNumber
  console.log('fromBlock', fromBlock)

  const contBan = await web3.eth.getBalance(contractAddr)
  console.log('contract balance', contBan)
  const accBan = await web3.eth.getBalance(property.from)
  console.log('acc1 balance', accBan)

  const reveal = reveals[0]

  const value = 1e17
  const choice = '1'
  const modulo = '2'
  const expiredBlockNumber = await web3.eth.getBlockNumber() + 200
  // const expiredBlockNumber = 5000000
  const commit = getCommit(reveal)

  const sign = getSignature(expiredBlockNumber, commit, property.pk)
  // console.log(commit, ', ', web3.utils.hexToNumber(sign[1]), ', ', sign[2], ', ', sign[3])
  // console.log('reveal', reveal)

  await placeBet(value, choice, modulo, expiredBlockNumber, commit, web3.utils.hexToNumber(sign[1]), sign[2], sign[3])
    .then(tx => {
      console.log(decodeLog(events.LogParticipant, tx.logs[0]))
    })

  await closeBet(reveal).then(tx => {
    const logs = tx.logs
    console.log(decodeLog(events.LogClosedBet, logs[logs.length - 1]))
  })

  // await refundBet(commit).then(tx => {
  //   console.log(decodeLog(events.LogRefund, tx.logs[0]))
  // })

  // await recharge(web3.utils.toWei('10', 'ether')).then(tx => {
  //   console.log(decodeLog(events.LogRecharge, tx.logs[0]))
  // })

  // await withdraw(web3.utils.toWei('0.5', 'ether')).then(tx => {
  //   console.log(decodeLog(events.LogDealerWithdraw, tx.logs[0]))
  // })

  // for (let i = 0; i < 250; i++) {
  //   await evmMine()
  // }

  // const eventAbi = events.LogDealerWithdraw
  const eventAbi = events.LogRecharge
  // console.log(eventAbi)
  // const encodeEventSignature = web3.eth.abi.encodeEventSignature(eventAbi)
  // await getEventLogs(fromBlock, null, contractAddr, [eventAbi.signature])
  //   .then(logs => {
  //     for (const o of logs) {
  //       const dl = decodeLog(eventAbi, o)
  //       console.log(dl)
  //     }
  //   })
}

test()
