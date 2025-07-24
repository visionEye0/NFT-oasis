const { ethers } = require("hardhat");


async function main() {
  // const NFT = await ethers.deployContract("NFT");
  // await NFT.waitForDeployment();
  // console.log("NFT contract deployed at:", await NFT.getAddress());

  const Marketplace = await ethers.deployContract("Marketplace");
  await Marketplace.waitForDeployment();
  console.log("Marketplace contract deployed at:", await Marketplace.getAddress());
}

main().catch(console.error);
