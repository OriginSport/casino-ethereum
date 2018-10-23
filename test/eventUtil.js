const web3 = require('web3')

module.exports = {
  getEventLogs: async function (_fromBlock, _toBlock, _address, _topics) {
    return await web3.eth.getPastLogs({fromBlock: _fromBlock, toBlock: _toBlock, address: _address, topics: _topics})
  },

  getEvents: function (_abi) {
    let events = {}
    for (const o of _abi) {
      if (o.type === 'event') {
        events[o.name] = o
      }
    }
    return events
  },

  decodeLog: function (_eventAbi, _log) {
    const topics = _eventAbi.anonymous ? _log.topics : _log.topics.slice(1)
    return web3.eth.abi.decodeLog(_eventAbi.inputs, _log.data, topics)
  }
}
