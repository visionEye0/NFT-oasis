# Oasis NFT Marketplace 🚀

A full-stack NFT marketplace DApp built with **Solidity**, **Hardhat**, **Next.js**, **Ethers.js**, and **Pinata/IPFS**

---

## 🎉 Live Demo
**https://nft-oasis.vercel.app/**

---

## 🚀 Features

- Mint new NFTs with on-chain metadata (name, description, image)
- List NFTs for sale in a simple marketplace
- Buy NFTs with ETH
- Cancel listings via smart-contract support
- Responsive frontend styled for dark-mode aesthetic

---

## 🧩 Project Structure

```
NFT‑oasis/
├── contracts #Solidity smart contracts
├── scripts
│   └── deploy.js #deploy script
├── test #hardhat tests
├── web #Next.js frontend
│   ├── src
│   └── public
├── hardhat.config.js
├── package.json
└── README.md
```

---

## ⚙️ Setup & Local Development

1. **Clone repo**  
   ```bash
   git clone https://github.com/visionEye0/NFT-oasis.git
   cd NFT-oasis

   ```

2. **Install dependencies**
   ```bash
   npm install
   cd web
   npm install
   ```

3. **Create a `.env` file at project root:

   ```text
   SEPOLIA_WALLET_PRIVATE_KEY=<your wallet private key>
   SEPOLIA_RPC_URL=<your infura sepolia rpc url>

   ```

4. **Deploy contracts** (using Hardhat):

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Create a `.env` file at project `/web/`:

   ```text
   NEXT_PUBLIC_NFT_ADDRESS=<deployed NFT contract address>
   NEXT_PUBLIC_MARKETPLACE_ADDRESS=<marketplace contract address>
   PINATA_JWT=<your Pinata JWT for upload>
   ```

6. **Launch frontend locally**:

   ```bash
   cd web
   npm run dev
   ```
   visit [http://localhost:3000](http://localhost:3000p)

## 🧾 Usage & Features

### Mint NFT

Fill in:
* NFT **Name**
* NFT **Description**
* Image file (via file input)

click **Upload & Mint NFT** → uploads image + metadata to Pinata → mints NFT on-chain.

### List NFT for Sale
* Input **Price in ETH**
* Click **List NFT**
* Prompt to input **Token ID** → upon inputing **Token Id** → contract approval then listing

### View & Buy Listings
* Click **Load Listings**
* Disaplays all active listings with:
    * NFT Image
    * Name & Description
    * Token ID & Price
* Click **Buy NFT** button to purchase the listing

## 💡 Troubleshooting Tips

- Ensure MetaMask is connected and on the same network (localhost or testnet).
- Errors like **execution reverted** may indicate:
  - Incorrect token ID
  - Marketplace not owning token
- Use console logs and snackbar error alerts to debug the frontend.

---

## 🧭 Extending the Platform

- Add pagination/search/filter to listings (e.g., by seller or traits).
- Support ERC‑20 or other token payments.
- Add features like **My NFTs**, **sales history**, or **royalties**.

---

## ✅ Summary

NFT‑Oasis empowers users to mint, list, and buy NFTs in a slick Next.js UI backed by Solidity & Hardhat.  
The live demo runs at: https://nft‑oasis.vercel.app/

Feel free to clone, explore, and build your own NFT experience!  

Happy building! 🎉
