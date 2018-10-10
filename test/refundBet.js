const {web3, property, sendSignedTxSimple} = require('./contractUtil.js')
const {getEvents} = require('./eventUtil')

const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)

let nonce = 0

async function autoRefundBet() {
  const transactionHash = contractJson.networks[property.networkID].transactionHash
  const events = getEvents(contractJson.abi)
  const fromBlock = (await web3.eth.getTransaction(transactionHash)).blockNumber
  console.log('fromBlock', fromBlock)

  const expirationBlocks = 250
  const manualCloseBlocks = 12
  const logParticipant = events.LogParticipant
  const blockNumber = await web3.eth.getBlockNumber()
  web3.eth.getPastLogs({fromBlock: fromBlock, address: contractAddr, topics: [logParticipant.signature]})
    .then(logs => {
      for (const log of logs) {
        const commit = '0x' + log.data.slice(130, 194)
        contract.methods.bets(commit)
          .call(async (error, result) => {
            if (error) {
              console.log('get bet [commit: ', commit, '] error!!!\r\n', error)
            } else {
              const isActive = result.isActive
              if (isActive) {
                console.log(result)
                const placeBlockNumber = parseInt(result.placeBlockNumber)
                // refund bet which is expired
                // manual close bet which hasn't been close auto
                if (blockNumber > placeBlockNumber + expirationBlocks) {
                  const data = contract.methods.refundBet(commit).encodeABI()
                  const currNonce = await web3.eth.getTransactionCount(property.from)
                  nonce = nonce > currNonce ? nonce : currNonce
                  await sendSignedTxSimple(contractAddr, data, nonce++)
                } else if (blockNumber > placeBlockNumber + manualCloseBlocks) {
                  const reveal = getReveal(commit)
                  const data = contract.methods.closeBet(reveal).encodeABI()
                  const currNonce = await web3.eth.getTransactionCount(property.from)
                  nonce = nonce > currNonce ? nonce : currNonce
                  await sendSignedTxSimple(contractAddr, data, nonce++)
                }
              }
            }
          })
      }
    })
}
const reveals = {}
const commits = []

const rs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
for (let i = 0; i < rs.length; i++) {
  const commit = web3.utils.soliditySha3(rs[i])
  reveals[commit] = rs[i]
  commits[i] = commit
}


function getReveal(_commit) {
  return reveals[_commit]
}

async function test() {
  await autoRefundBet()
}
test()
