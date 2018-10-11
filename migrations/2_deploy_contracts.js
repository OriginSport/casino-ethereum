const Casino = artifacts.require('Casino.sol')

module.exports = function(deployer) {
  deployer.deploy(Casino, { value: 5e18 })
}
