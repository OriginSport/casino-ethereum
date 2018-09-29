const {web3} = require('./contractUtil.js')

module.exports = {
  getEventLogs: async function (fromBlock, toBlock, address, topics) {
    return await web3.eth.getPastLogs({fromBlock: fromBlock, toBlock: toBlock, address: address, topics: topics})
  },

  getEvents: function (abi) {
    let events = {}
    for (const o of abi) {
      if (o.type === 'event') {
        events[o.name] = o
      }
    }
    return events
  },

  decodeLog: function (eventAbi, log) {
    const topics = eventAbi.anonymous ? log.topics : log.topics.slice(1)
    return web3.eth.abi.decodeLog(eventAbi.inputs, log.data, topics)
  }
}
