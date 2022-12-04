const main = async () => {
  const [owner, superCoder] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy("com");
  await domainContract.deployed();
  console.log("Contract deployed to:", domainContract.address);
  console.log("Contract deployed by:", owner.address);

  // Let's be extra generous with our payment (we're paying more than required)
  let txn = await domainContract.register("first",  {value: hre.ethers.utils.parseEther('1')});
  await txn.wait();
 
  txn = await domainContract.setRecord("first",  "here is the record");
  await txn.wait();

  // txn = await domainContract.connect(superCoder).register("first",  {value: hre.ethers.utils.parseEther('1')});
  // await txn.wait();

  txn = await domainContract.connect(superCoder).setRecord("first",  "i want this");
  await txn.wait();

  txn = await domainContract.connect(superCoder).register("areallyfakkinlongdomainname",  {value: hre.ethers.utils.parseEther('1')});
  await txn.wait();
 
  txn = await domainContract.getAllNames();

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
