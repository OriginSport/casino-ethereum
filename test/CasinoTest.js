const {web3, property, sendSignedTx, sendSignedTxSimple} = require('./contractUtil.js')


const contractJson = require('../build/contracts/Casino.json')
const contractAbi = contractJson.abi
const contractAddr = contractJson.networks[property.networkID].address
const contract = new web3.eth.Contract(contractAbi, contractAddr)


async function test() {

}
test()
