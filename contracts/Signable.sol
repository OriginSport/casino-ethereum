pragma solidity ^0.4.24;

/**
 * @title Signable
 * @dev The Signable contract has an signer address, and provides basic authorization control
 *      functions, this simplifies the implementation of "user permissions"
 */
contract Signable {
  address public signer;

  event SignershipTransferred(address indexed previousSigner, address indexed newSigner);

  /**
   * @dev Throws if called by any account other than the signer
   */
  modifier onlySigner() {
    require(msg.sender == signer);
    _;
  }

  /**
   * @dev The Signable constructor sets the original `signer` of the contract to the sender
   *      account
   */
  constructor() public {
    signer = msg.sender;
  }

  /**
   * @dev Allows the current signer to transfer control of the contract to a newSigner
   * @param _newSigner The address to transfer signership to
   */
  function transferSignership(address _newSigner) public onlySigner {
    _transferSignership(_newSigner);
  }
  
  /**
   * @dev Transfers control of the contract to a newSigner.
   * @param _newSigner The address to transfer signership to.
   */
  function _transferSignership(address _newSigner) internal {
    require(_newSigner != address(0));
    emit SignershipTransferred(signer, _newSigner);
    signer = _newSigner;
  }
}
