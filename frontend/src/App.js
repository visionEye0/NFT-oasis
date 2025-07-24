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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [price, setPrice] = useState("");
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
        setNFT(new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer));
        setMarketplace(new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer));
      }
    };
    init();
  }, []);

  async function uploadAndMint() {
    if (!name || !description || !file) {
      return alert("Please complete all fields before uploading.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("description", description);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      return alert("Upload failed, check console");
    }

    const { uri } = await res.json();
    console.log("Received Token URI:", uri);

    const tx = await nft.mint(uri);
    const receipt = await tx.wait();
    const tokenId = receipt.logs[0].args[2];
    alert(`✅ Minted successfully! Token ID: ${tokenId}`);
  }

  const list = async () => {
    const tokenId = prompt("Enter Token ID to list:");
    const ethPrice = ethers.parseEther(price);
    try {
      await nft.approve(MARKETPLACE_ADDRESS, tokenId);
      await (await marketplace.listNFT(NFT_ADDRESS, tokenId, ethPrice)).wait();
      alert("✅ Listed for sale!");
    } catch (err) {
      console.error(err);
      alert("Listing failed: " + (err.reason || err.message));
    }
  };

  const buy = async (id, cost) => {
    await (await marketplace.buyNFT(id, { value: cost })).wait();
    alert("✅ Purchase completed!");
  };

  const loadListings = async () => {
    const items = [];
    const count = await marketplace.itemCount();
    for (let i = 1n; i <= count; i++) {
      const [seller, nftAddr, tokenId, priceFt] = await marketplace.listings(i);
      const uri = await nft.tokenURI(tokenId);
      const metaRes = await fetch(uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
      const meta = await metaRes.json();
      items.push({ id: i, seller, tokenId, price: priceFt, metadata: meta });
    }
    setListings(items);
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1>🖼️ Oasis NFT Marketplace</h1>
      <p>Connected wallet: <b>{account}</b></p>

      <section>
        <h2>🔹 Mint New NFT</h2>
        <input
          type="text"
          placeholder="NFT Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="NFT Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
        />
        <br />
        <button onClick={uploadAndMint}>Upload + Mint NFT</button>
      </section>

      <hr />

      <section>
        <h2>🔹 List NFT for Sale</h2>
        <input
          type="text"
          placeholder="Price in ETH"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <button onClick={list}>List NFT</button>
      </section>

      <hr />

      <section>
        <h2>🔹 Marketplace Listings</h2>
        <button onClick={loadListings}>Load Listings</button>
        {listings.map(item => (
          <div key={item.id} style={{ border: "1px solid #ccc", padding: 15, margin: "1rem 0" }}>
            <img
              src={item.metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
              alt={item.metadata.name}
              style={{ maxWidth: 200, borderRadius: 8 }}
            />
            <h3>{item.metadata.name}</h3>
            <p>{item.metadata.description}</p>
            <p>Token ID: {item.tokenId.toString()} • Price: {ethers.formatEther(item.price)} ETH</p>
            <button onClick={() => buy(item.id, item.price)}>Buy NFT</button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;
