const properties = require('./properties.js')
let property = properties.development
// property = properties.ropsten
// property = properties.mainnet

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(property.url))

async function deploy(contractAbi, contractBytecode) {
    const contract = new web3.eth.Contract(contractAbi)
    return (await contract.deploy({data: contractBytecode}).send({from: property.from, gasLimit: property.gasLimit}))._address
}

async function sendSignedTx(to, data, nonce, value, gasPrice, gasLimit, from, pk) {
    console.debug('nonce', nonce)
    console.debug('gasPrice', gasPrice)
    console.debug('gasLimit', gasLimit)
    const rawTx = {
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        from: from,
        to: to,
        value: value,
        data: data
    }
    const signedData = await web3.eth.accounts.signTransaction(rawTx, pk)
    // console.debug('signedData', signedData)

    return await web3.eth.sendSignedTransaction(signedData.rawTransaction)
        .on('transactionHash', txHash => console.log('txHash', txHash))
        .catch(error => console.error('sendSignedTx error:', error))
}

async function sendSignedTxHelper(to, data, value, pk) {
    const from = await web3.eth.accounts.privateKeyToAccount(pk).address
    const nonce = await web3.eth.getTransactionCount(from)
    const gasPrice = await web3.eth.getGasPrice()
    const gasLimit = data ? await contractEstimateGas(property.from, to, data) : 21000
    return await sendSignedTx(to, data, nonce, value, gasPrice, gasLimit, from, pk)
}

async function sendSignedTxSimple(to, data) {
    const nonce = await web3.eth.getTransactionCount(property.from)
    const gasPrice = await web3.eth.getGasPrice()
    const gasLimit = data ? await contractEstimateGas(property.from, to, data) : 21000
    return await sendSignedTx(to, data, nonce, 0, gasPrice, gasLimit, property.from, property.pk)
}

async function contractEstimateGas(from, to, data) {
    return await web3.eth.estimateGas({from: from, to: to, data: data}, function (error, estimateGas) {
        console.info('estimateGas:', estimateGas)
    })
}

async function coverTx(nonce, gasPrice, from, pk) {
    await sendSignedTx(from, '', nonce, 0, gasPrice, 21000, from, pk)
}

function getString(hexString) {
    return web3.utils.hexToString(hexString)
}

function getBytes(string) {
    return web3.utils.asciiToHex(string)
}

function getMsgHash(msg) {
    return web3.utils.sha3('\x19Ethereum Signed Message:\n' + msg.length + msg)
}

module.exports = {
    web3: web3,
    property: property,
    deploy: deploy,
    sendSignedTx: sendSignedTx,
    sendSignedTxHelper: sendSignedTxHelper,
    sendSignedTxSimple: sendSignedTxSimple,
    contractEstimateGas: contractEstimateGas,
    coverTx: coverTx,
    getString: getString,
    getBytes: getBytes,
    getMsgHash: getMsgHash
}
