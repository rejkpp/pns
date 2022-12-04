const main = async () => {
  const [owner, randomPerson] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy("com");
  await domainContract.deployed();
  console.log("Contract deployed to:", domainContract.address);
  console.log("Contract deployed by:", owner.address);

  let txn = await domainContract.register("dillydally", {value: hre.ethers.utils.parseEther('0.1')});
  await txn.wait();

  const domainOwner = await domainContract.getAddress("dillydally");
  console.log("Owner of domain:", domainOwner);

  let txn2 = await domainContract.setRecord("dillydally", "Haha my domain");
  await txn2.wait();
  console.log("record set:", txn2);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));


};

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
