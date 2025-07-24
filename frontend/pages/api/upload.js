// upload.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PINATA_JWT = process.env.PINATA_JWT;

async function uploadToPinata(imagePath) {
  const data = new FormData();
  const file = fs.createReadStream(imagePath);
  data.append("file", file);

  const metadata = JSON.stringify({
    name: path.basename(imagePath),
  });
  data.append("pinataMetadata", metadata);

  const headers = {
    Authorization: `Bearer ${PINATA_JWT}`,
    ...data.getHeaders(),
  };

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, { headers });
  const ipfsHash = res.data.IpfsHash;
  return `ipfs://${ipfsHash}`;
}

async function uploadMetadata(name, description, imageCID) {
  const metadata = {
    name,
    description,
    image: imageCID,
  };

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    metadata,
    {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    }
  );
  return `ipfs://${res.data.IpfsHash}`;
}

// Example usage:
async function main() {
  const imagePath = "./nft-images/sample.png";
  const imageCID = await uploadToPinata(imagePath);
  const metadataCID = await uploadMetadata("Cool NFT", "Minted via Pinata IPFS", imageCID);
  console.log("✅ Metadata URL:", metadataCID);
}

main().catch(console.error);
