const {web3, property, deploy, sendSignedTx, sendSignedTxHelper, sendSignedTxSimple, evmMine, getString} = require('./contractUtil.js')
const {getEventLogs, getEvents, decodeLog} = require('./eventUtil')

const Account = require("eth-lib/lib/account");

const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const networkID = property.networkID
const contractAddr = contractJson.networks[networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)


/**
 * get commit by sha3(_reveal)
 * @param _reveal
 * @returns {*}
 */
function getCommit(_reveal) {
  return web3.utils.soliditySha3(_reveal)
}

/**
 * get bet information
 * @param _commit bet key provide by croupier
 * @returns {Promise<*>}
 */
async function getBet(_commit) {
  return await contract.methods.bets(_commit).call()
}

/**
 * get available balance
 * @returns {Promise<*>}
 */
async function getAvailableBalance() {
  return await contract.methods.getAvailableBalance().call()
}

/**
 * place bet
 * @param _value bet amount
 * @param _choice  bet mask choice(binary convert to decimal)
 * @param _modulo  bet model. eg. coin:2, dice:6, dice*2:36, rollUnder:100
 * @param _expiredBlockNumber  expiration blockNumber limit
 * @param _commit  bet key provide by croupier
 * @param _v signature provide by croupier
 * @param _r signature provide by croupier
 * @param _s signature provide by croupier
 * @param _pk private key of player account
 * @returns {Promise<*>}
 */
async function placeBet(_value, _choice, _modulo, _expiredBlockNumber, _commit, _v, _r, _s, _pk) {
  const data = contract.methods.placeBet(_choice, _modulo, _expiredBlockNumber, _commit, _v, _r, _s).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, _value, _pk)
}

/**
 * close bet which is active
 * @param _reveal bet secret key provide by croupier
 * @param _pk private key of croupier account
 * @returns {Promise<*>}
 */
async function closeBet(_reveal, _pk) {
  const data = contract.methods.closeBet(_reveal).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * close bet which is active and expired
 * @param _reveal bet secret key provide by croupier
 * @param _blockHash  blockHash of placeBetNumber
 * @param _pk private key of croupier account
 * @returns {Promise<*>}
 */
async function closeExpiredBet(_reveal, _blockHash, _pk) {
  const data = contract.methods.closeExpiredBet(_reveal, _blockHash).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * get blockHash of placeBetNumber by reveal
 * @param _reveal bet secret key provide by croupier
 * @returns {Promise<*>}
 */
async function getBlockHash(_reveal) {
  const bet = await getBet(getCommit(_reveal))
  if (bet.placeBlockNumber !== '0') {
    return (await web3.eth.getBlock(bet.placeBlockNumber)).hash
  }
}

/**
 * refund bet expired
 * @param _commit bet key provide by croupier
 * @param _pk private key of croupier account
 * @returns {Promise<*>}
 */
async function refundBet(_commit, _pk) {
  const data = contract.methods.refundBet(_commit).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * withdraw available balance in casino contract
 * @param _amount lt (casino.balance - bankFund)
 * @param _pk private key of owner account
 * @returns {Promise<*>}
 */
async function withdraw(_amount, _pk) {
  const data = contract.methods.withdraw(_amount).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * recharge ether to casino contract
 * @param _amount recharge amount
 * @param _pk private key of from account
 * @returns {Promise<*>}
 */
async function recharge(_amount, _pk) {
  const data = contract.methods.recharge().encodeABI()
  return await sendSignedTxHelper(contractAddr, data, _amount, _pk)
}

/**
 * transfer signer, only owner and signer can invoke
 * @param _address  new signer address
 * @param _pk private key of signer account
 * @returns {Promise<*>}
 */
async function setSigner(_address, _pk) {
  const data = contract.methods.transferSigner(_address).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * transfer croupier, only owner and croupier can invoke
 * @param _address  new croupier address
 * @param _pk private key of croupier account
 * @returns {Promise<*>}
 */
async function setCroupier(_address, _pk) {
  const data = contract.methods.transferCroupier(_address).encodeABI()
  return await sendSignedTxHelper(contractAddr, data, null, _pk)
}

/**
 * get signature of message hash sha3(expiredBlockNumber, commit)
 * @param _expiredBlockNumber  expiration blockNumber limit
 * @param _commit  bet key provide by croupier
 * @param _pk  private key of signer account
 * @returns {*[]}
 */
function getSignature(_expiredBlockNumber, _commit, _pk) {
  const msgHash = web3.utils.soliditySha3(_expiredBlockNumber, _commit)
  const signature = Account.sign(msgHash, _pk)
  const r = signature.slice(0, 66)
  const s = '0x' + signature.slice(66, 130)
  const v = signature.slice(130, 132)
  return [signature, v, r, s]
}


async function test() {
  const reveals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  let reveal = reveals[1]
  let commit = getCommit(reveal)

  const playerPk = property.pk
  const signerPk = property.pk
  const croupierPk = property.pk
  const ownerPk = property.pk

  const events = getEvents(contractAbi)
  const transactionHash = contractJson.networks[networkID].transactionHash
  const fromBlock = (await web3.eth.getTransaction(transactionHash)).blockNumber
  console.log('fromBlock', fromBlock)

  const contBan = await web3.eth.getBalance(contractAddr)
  console.log('contract balance', contBan)
  const accBan = await web3.eth.getBalance(property.from)
  console.log('acc1 balance', accBan)

  const value = 1e17
  const choice = '1'
  const modulo = '2'
  const expiredBlockNumber = await web3.eth.getBlockNumber() + 200

  // const sign = getSignature(expiredBlockNumber, commit, property.pk)
  // await placeBet(value, choice, modulo, expiredBlockNumber, commit, web3.utils.hexToNumber(sign[1]), sign[2], sign[3], playerPk)
  //   .then(tx => {
  //     console.log(decodeLog(events.LogParticipant, tx.logs[0]))
  //   })

  // await closeBet(reveal, croupierPk).then(tx => {
  //   const logs = tx.logs
  //   console.log(decodeLog(events.LogClosedBet, logs[logs.length - 1]))
  // })

  /* test closeExpiredBet */
  // const blockHash = await getBlockHash(reveal)
  // console.log('blockHash', blockHash)
  // await closeExpiredBet(reveal, blockHash, croupierPk).then(tx => {
  //   const logs = tx.logs
  //   console.log(decodeLog(events.LogClosedExpiredBet, logs[logs.length - 1]))
  // })

  // await refundBet(commit, croupierPk).then(tx => {
  //   console.log(decodeLog(events.LogRefund, tx.logs[0]))
  // })

  // await recharge(web3.utils.toWei('1', 'ether'), croupierPk).then(tx => {
  //   console.log(decodeLog(events.LogRecharge, tx.logs[0]))
  // })

  // await withdraw(web3.utils.toWei('0.5', 'ether'), ownerPk).then(tx => {
  //   console.log(decodeLog(events.LogDealerWithdraw, tx.logs[0]))
  // })

  // await getBet(getCommit(reveal)).then(data => console.log(data))

  // contract.methods.signer().call().then(data => console.log('signer', data))
  // await setSigner('0x243d416DEF4fA6eF0842837d5F72D51d7AF36791', ownerPk).then(tx => {
  //   console.log(decodeLog(events.SignerTransferred, tx.logs[0]))
  // })

  // contract.methods.croupier().call().then(data => console.log('croupier', data))
  // await setCroupier('0x243d416DEF4fA6eF0842837d5F72D51d7AF36791', ownerPk).then(tx => {
  //   console.log(decodeLog(events.CroupierTransferred, tx.logs[0]))
  // })

  // await getAvailableBalance().then(data => console.log('available balance', data))
  // contract.methods.bankFund().call().then(data => console.log('bankFund', data))
  // web3.eth.getBlockNumber().then(data => console.log('blockNumber', data))

  /* test deploy contract */
  // deploy(contractAbi, contractJson.bytecode, property.pk, web3.utils.toWei('1')).then(tx => console.log(tx))

  // for (let i = 0; i < 251; i++) {
  //   await evmMine()
  // }

  // let counter = 0
  // const event = events.LogParticipant
  // getEventLogs(fromBlock, null, contractAddr, [event.signature]).then(async logs => {
  //   for (const log of logs) {
  //     web3.eth.getTransaction(log.transactionHash).then(tx => {
  //       if (log.blockHash !== tx.blockHash) {
  //         console.log(log.blockHash , tx.blockHash)
  //       }
  //     })
  //   }
  // })

}

test()

