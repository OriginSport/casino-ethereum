const {web3, property, sendSignedTxHelper} = require('./contractUtil.js')
const {getEvents} = require('./eventUtil')

const contractJson = require('../build/contracts/Casino.json')
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractJson.abi, contractAddr)

const ownerPk = property.pk
const owner = property.from
let nonce = 0

let frozenBan = 0
let counter = 0

async function autoRefundBet() {
  const transactionHash = contractJson.networks[property.networkID].transactionHash
  const events = getEvents(contractJson.abi)
  const fromBlock = (await web3.eth.getTransaction(transactionHash)).blockNumber
  console.log('fromBlock', fromBlock)

  const expirationBlocks = 250
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
                const placeBlockNumber = parseInt(result.placeBlockNumber)
                if (blockNumber > placeBlockNumber + expirationBlocks) {
                  // refund bet which is expired
                  frozenBan += parseInt(result.amount)
                  console.log(counter++, frozenBan)
                  const data = contract.methods.refundBet(commit).encodeABI()
                  const currNonce = await web3.eth.getTransactionCount(owner)
                  nonce = nonce > currNonce ? nonce : currNonce
                  await sendSignedTxHelper(contractAddr, data, null, ownerPk, nonce++)
                }
              }
            }
          })
      }
    })
}

async function test() {
  web3.eth.getBalance(contractAddr).then(data => console.log('ban before', data))
  await autoRefundBet()
  web3.eth.getBalance(contractAddr).then(data => console.log('ban after', data))

}
test()
