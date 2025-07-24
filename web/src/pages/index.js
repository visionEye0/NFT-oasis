// pages/index.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTAbi from "@/contractABIs/NFT.json";
import MarketplaceAbi from "@/contractABIs/Marketplace.json";

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

export default function Home() {
  const [account, setAccount] = useState("");
  const [nft, setNFT] = useState(null);
  const [marketplace, setMarketplace] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [price, setPrice] = useState("");
  const [listings, setListings] = useState([]);

  // Only connect wallet on button click—not automatically in useEffect
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask to continue");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Request accounts once
      const [firstAccount] = await provider.send("eth_requestAccounts", []);
      setAccount(firstAccount);

      const signer = provider.getSigner();
      setNFT(new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer));
      setMarketplace(new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer));
    } catch (err) {
      if (err.code === -32002) {
        alert("Connection pending—please approve MetaMask");
      } else {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    // If account was already connected externally (e.g. page refresh), auto-init provider
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length === 0) return;
      const signer = provider.getSigner();
      setAccount(accounts[0]);
      setNFT(new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer));
      setMarketplace(new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer));
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

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected wallet: <b>{account}</b></p>
      )}

      {/* Mint Section */}
      <section>
        <h2>🔹 Mint New NFT</h2>
        <input placeholder="NFT Name" value={name} onChange={e => setName(e.target.value)} /><br/>
        <input placeholder="NFT Description" value={description} onChange={e => setDescription(e.target.value)} /><br/>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} /><br/>
        <button onClick={uploadAndMint} disabled={!account}>Upload & Mint NFT</button>
      </section>

      {/* ... rest unchanged */}
    </div>
  );
}
