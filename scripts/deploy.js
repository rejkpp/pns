const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();

  console.log("Deploying contracts with account: ", deployer.address);
  console.log("Account balance: ", accountBalance.toString());

  const Token = await hre.ethers.getContractFactory('Domains');
  const portal = await Token.deploy("com");
  await portal.deployed();

  console.log("Contract deployed to:", domainContract.address);

  // CHANGE THIS DOMAIN TO SOMETHING ELSE! I don't want to see OpenSea full of bananas lol
  let txn = await domainContract.register("bubbles",  {value: hre.ethers.utils.parseEther('0.001')});
  await txn.wait();
  console.log("Minted domain bubbles.com");

  txn = await domainContract.setRecord("bubbles", "i am a record");
  await txn.wait();
  console.log("Set record for bubbles.com");

  txn = await domainContract.withdraw();
  await txn.wait();
  console.log("withdraw");

  const address = await domainContract.getAddress("bubbles");
  console.log("Owner of domain bubbles:", address);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
