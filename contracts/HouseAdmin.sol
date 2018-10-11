pragma solidity ^0.4.24;
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title HouseAdmin
 * @dev The HouseAdmin contract has a signer address and a croupier address, and provides basic authorization control
 *      functions, this simplifies the implementation of "user permissions"
 */
contract HouseAdmin is Ownable {
  address public signer;
  address public croupier;

  event SignerTransferred(address indexed previousSigner, address indexed newSigner);
  event CroupierTransferred(address indexed previousCroupier, address indexed newCroupier);

  /**
   * @dev Throws if called by any account other than the signer or owner
   */
  modifier onlySigner() {
    require(msg.sender == signer || msg.sender == owner);
    _;
  }

  /**
   * @dev Throws if called by any account other than the croupier or owner
   */
  modifier onlyCroupier() {
    require(msg.sender == croupier || msg.sender == owner);
    _;
  }

  /**
   * @dev The Signable constructor sets the original `signer` of the contract to the sender
   *      account
   */
  constructor() public {
    signer = msg.sender;
    croupier = msg.sender;
  }

  /**
   * @dev Allows the current signer to transfer control of the contract to a newSigner
   * @param _newSigner The address to transfer signership to
   */
  function transferSigner(address _newSigner) public onlySigner {
    _transferSigner(_newSigner);
  }
  
  /**
   * @dev Allows the current croupier to transfer control of the contract to a newCroupier
   * @param _newCroupier The address to transfer croupiership to
   */
  function transferCroupier(address _newCroupier) public onlyCroupier {
    _transferCroupier(_newCroupier);
  }

  /**
   * @dev Transfers control of the contract to a newSigner.
   * @param _newSigner The address to transfer signership to.
   */
  function _transferSigner(address _newSigner) internal {
    require(_newSigner != address(0));
    emit SignerTransferred(signer, _newSigner);
    signer = _newSigner;
  }

  /**
   * @dev Transfers control of the contract to a newCroupier.
   * @param _newCroupier The address to transfer croupiership to.
   */
  function _transferCroupier(address _newCroupier) internal {
    require(_newCroupier != address(0));
    emit CroupierTransferred(croupier, _newCroupier);
    croupier = _newCroupier;
  }
}
