const {web3, property, sendSignedTx, sendSignedTxSimple, getString, getBytes} = require('./contractUtil.js')

const Account = require("eth-lib/lib/account");

const contractJson = require('../build/contracts/Up2God.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)

const reveals = ['0','1','2','3','4','5','6','7','8','9']
const reveal = reveals[4]

function getCommit(reveal) {
    return web3.utils.soliditySha3(reveal)
}

function getInfo() {
    contract.methods.bankFund().call().then(data => console.info('bankFund', data))
    contract.methods.jackpotFund().call().then(data => console.info('jackpotFund', data))
    contract.methods.maxProfit().call().then(data => console.info('maxProfit', data))
    contract.methods.secretSigner().call().then(data => console.info('secretSigner', data))
    contract.methods.owner().call().then(data => console.info('owner', data))
}

async function getBet(reveal) {
    await contract.methods.bets(getCommit(reveal)).call()
        .then(async data => {
            console.info('bet', data)
            const blockHash = (await web3.eth.getBlock(data.placeBlockNumber)).hash
            const entropy = web3.utils.soliditySha3(reveal, blockHash)
            console.log('blockHash', blockHash, 'entropy', entropy)
            const dice = entropy % data.modulo
            const jackpot = entropy % 1000
            console.log('dice', dice, 'jackpot', jackpot)
        })
}

async function setMaxProfit(maxProfit) {
    const data = contract.methods.setMaxProfit(maxProfit).encodeABI()
    await sendSignedTxSimple(contractAddr, data)
}

async function placeBet(value, betMask, modulo, expiredBlockNumber, commit, v, r, s) {
    const data = contract.methods.placeBet(betMask, modulo, expiredBlockNumber, commit, v, r, s).encodeABI()
    const nonce = await web3.eth.getTransactionCount(property.from)
    const gasPrice = await web3.eth.getGasPrice()
    const gasLimit = data ? await web3.eth.estimateGas({from: property.from, to: contractAddr, value: value, data: data}) : 21000
    await sendSignedTx(contractAddr, data, nonce, value, gasPrice, gasLimit, property.from, property.pk)
}

async function settleBet(reveal) {
    const data = contract.methods.settleBet(reveal).encodeABI()
    contract.events.LogReward()
    // const tx = await sendSignedTxSimple(contractAddr, data)
    const tx = await web3.eth.getTransactionReceipt('0x3243689f0b4c977271d2facbb926ca0890d7b466523cfe3f454305690ad406e6')
    for (let i = 0; i < tx.logs.length; i++) {
        console.log('signature', tx.logs[i].topics[0])
        console.log('player', '0x' + tx.logs[i].topics[1].slice(26, 66))
        console.log('amount', web3.utils.hexToNumber(tx.logs[i].data))
    }
}

async function test() {
    const balance = await web3.eth.getBalance(contractAddr).then(value => console.log('this.balance', value))
    getInfo()
    await setMaxProfit(1e19)

    const value = 1e17
    const betMask = 1
    const modulo = 2
    const expiredBlockNumber = await web3.eth.getBlockNumber() + 200
    const commit = getCommit(reveal)
    const msgHash = web3.utils.soliditySha3(expiredBlockNumber, commit)
    const signature = Account.sign(msgHash, property.pk)
    const r = signature.slice(0, 66)
    const s = '0x' + signature.slice(66, 130)
    const v = signature.slice(130, 132)
    console.log('v', web3.utils.hexToNumber(v))
    // await placeBet(value, betMask, modulo, expiredBlockNumber, commit, v, r, s)

    await settleBet(reveal)
    getInfo()


}
test()
