require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env.QUICK_NODE_END_POINT,
      accounts: [process.env.PRIVATE_KEY],
    }
  }
};
