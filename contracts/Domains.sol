// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import { StringUtils } from "./libraries/StringUtils.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";

contract Domains is ERC721URIStorage {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  string public tld;

  string svgPartOne = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><defs><linearGradient id="a" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#00FABE"/><stop offset="1" stop-color="#BE00FA" stop-opacity=".89"/></linearGradient></defs><text x="24" y="140" font-size="24" fill="#fff" filter="url(#b)" font-family="Courier Prime Code, Apple Color Emoji,sans-serif">';
  string svgPartTwo = '</text></svg>';

  mapping(string => address) public domains;
  mapping(string => string) public records;


  constructor(string memory _tld) payable ERC721("ramiro is building a name service", "COM"){
    tld = _tld;
    console.log("name service nft deployed:", _tld);
  }

  function price(string calldata name) public pure returns(uint) {
    uint len = StringUtils.strlen(name);
    require(len > 0);
    if (len == 2) {
      return 4 * 10**16; // 5 MATIC = 5 000 000 000 000 000 000 (18 decimals). We're going with 0.04 Matic cause the faucets don't give a lot
    } else if (len == 3) {
      return 3 * 10**16; // To charge smaller amounts, reduce the decimals. This is 0.03
    } else if (len == 4) {
      return 2 * 10**16; // To charge smaller amounts, reduce the decimals. This is 0.02
    } else {
      return 1 * 10**16;
    }
  }

  function register(string calldata name) public payable{
      require(domains[name] == address(0),"domain already registered");

      uint _price = price(name);

      require(msg.value >= _price, "not enough matic paid");

      // Combine the name passed into the function  with the TLD
      string memory _name = string(abi.encodePacked(name, ".", tld));
      // Create the SVG (image) for the NFT with the name
      string memory finalSvg = string(abi.encodePacked(svgPartOne, _name, svgPartTwo));
      uint256 newRecordId = _tokenIds.current();
      uint256 length = StringUtils.strlen(name);
      string memory strLen = Strings.toString(length);

      console.log("Registering %s.%s on the contract with tokenID %d", name, tld, newRecordId);

      // Create the JSON metadata of our NFT. We do this by combining strings and encoding as base64
      string memory json = Base64.encode(
        abi.encodePacked(
        '{"name": "',
        _name,
        '", "description": "A domain on ramiros name service", "image": "data:image/svg+xml;base64,',
        Base64.encode(bytes(finalSvg)),
        '","length":"',
        strLen,
        '"}'
        )
      );

      string memory finalTokenUri = string( abi.encodePacked("data:application/json;base64,", json));

      console.log("\n--------------------------------------------------------");
      console.log("Final tokenURI", finalTokenUri);
      console.log("--------------------------------------------------------\n");

      _safeMint(msg.sender, newRecordId);
      _setTokenURI(newRecordId, finalTokenUri);
      domains[name] = msg.sender;

      _tokenIds.increment();

  }

  function getAddress(string calldata name) public view returns (address) {
      return domains[name];
  }

  function setRecord(string calldata name, string calldata record) public {
      require(domains[name] == msg.sender,"you are not the owner!!!");
      records[name] = record;
  }

  function getRecord(string calldata name) public view returns(string memory) {
      return records[name];
  }

}