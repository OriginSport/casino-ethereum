const config = require('./truffle-config')

const defaultConfig = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    staging: {
      host: "localhost",
      port: 8546,
      network_id: 1337
    },
    rinkeby: {
      host: "1.2.3.4",
      port: 8545,
      network_id: 4
    },
    ropsten: {
      host: "1.2.3.4",
      port: 8545,
      network_id: 3
    }
  },
  solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
}

const newConfig = Object.assign(defaultConfig, config)

module.exports = newConfig
