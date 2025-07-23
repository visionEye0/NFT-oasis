// App.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTAbi from "./contractABIs/NFT.json";
import MarketplaceAbi from "./contractABIs/Marketplace.json";

const NFT_ADDRESS = process.env.REACT_APP_NFT_ADDRESS;
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS;

function App() {
  const [account, setAccount] = useState("");
  const [nft, setNFT] = useState();
  const [marketplace, setMarketplace] = useState();
  const [tokenURI, setTokenURI] = useState("");
  const [price, setPrice] = useState("");
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());

        const nft = new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer);
        const market = new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer);
        setNFT(nft);
        setMarketplace(market);
      }
    };
    init();
  }, []);

  const mint = async () => {
    const tx = await nft.mint(tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.logs[0].args[2]; // tokenId emitted
    alert("Minted tokenId: " + tokenId);
  };

  const list = async () => {
    const tokenId = prompt("Token ID to list:");
    const ethPrice = ethers.parseEther(price);
    await nft.approve(MARKETPLACE_ADDRESS, tokenId);
    const tx = await marketplace.listNFT(NFT_ADDRESS, tokenId, ethPrice);
    await tx.wait();
    alert("NFT listed!");
  };

  const buy = async (id, cost) => {
    const tx = await marketplace.buyNFT(id, { value: cost });
    await tx.wait();
    alert("NFT bought!");
  };

  const loadListings = async () => {
    const items = [];
    const count = await marketplace.itemCount();
    for (let i = 1n; i <= count; i++) {
      const item = await marketplace.listings(i);
      items.push({ id: i, ...item });
    }
    setListings(items);
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🖼️ Oasis NFT Marketplace</h1>
      <p>Connected: {account}</p>

      <input value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} placeholder="Token URI (ipfs://...)" />
      <button onClick={mint}>Mint NFT</button>

      <br /><br />

      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price in ETH" />
      <button onClick={list}>List NFT</button>

      <br /><br />
      <button onClick={loadListings}>Load Listings</button>
      {listings.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}>
          <p><b>ID:</b> {item.id.toString()}</p>
          <p><b>Token:</b> {item.tokenId.toString()}</p>
          <p><b>Price:</b> {ethers.formatEther(item.price)} ETH</p>
          <button onClick={() => buy(item.id, item.price)}>Buy</button>
        </div>
      ))}
    </div>
  );
}

export default App;
