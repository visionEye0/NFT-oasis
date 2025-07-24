import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTAbi from "@/contractABIs/NFT.json";
import MarketplaceAbi from "@/contractABIs/Marketplace.json";

const NFT_ADDRESS          = process.env.NEXT_PUBLIC_NFT_ADDRESS;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

export default function Home() {
  const [account, setAccount]         = useState("");
  const [nft, setNFT]                 = useState(null);
  const [marketplace, setMarketplace] = useState(null);

  // form state
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile]               = useState(null);
  const [price, setPrice]             = useState("");

  // listings and loading state
  const [listings, setListings]       = useState([]);
  const [isConnecting, setIsConnecting]     = useState(false);
  const [isMinting, setIsMinting]           = useState(false);
  const [isListing, setIsListing]           = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [buyingId, setBuyingId]             = useState(null);

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAccount(userAddress);
      setNFT(new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer));
      setMarketplace(new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer));
    } catch (err) {
      console.error(err);
      alert(err.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto‑init if already connected
  useEffect(() => {
    (async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length === 0) return;
      const signer = await provider.getSigner();
      setAccount(accounts[0]);
      setNFT(new ethers.Contract(NFT_ADDRESS, NFTAbi.abi, signer));
      setMarketplace(new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi.abi, signer));
    })();
  }, []);

  // Upload & Mint
  const uploadAndMint = async () => {
    if (!name || !description || !file) {
      alert("Please fill in all fields");
      return;
    }
    setIsMinting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { uri } = await res.json();

      const tx = await nft.mint(uri);
      await tx.wait();
      alert("✅ Minted successfully!");
    } catch (err) {
      console.error(err);
      alert("Mint failed: " + (err.reason || err.message));
    } finally {
      setIsMinting(false);
    }
  };

  // Approve & List
  const listNFT = async () => {
    const tokenId = prompt("Enter Token ID to list:");
    if (!tokenId || !price) {
      alert("Token ID and price required");
      return;
    }
    setIsListing(true);
    try {
      const approveTx = await nft.approve(MARKETPLACE_ADDRESS, tokenId);
      await approveTx.wait();
      const ethPrice = ethers.parseEther(price);
      const listTx = await marketplace.listNFT(NFT_ADDRESS, tokenId, ethPrice);
      await listTx.wait();
      alert("✅ Listed successfully!");
    } catch (err) {
      console.error(err);
      alert("Listing failed: " + (err.reason || err.message));
    } finally {
      setIsListing(false);
    }
  };

  // Buy
  const buyNFT = async (itemId) => {
    setBuyingId(itemId);
    try {
      // fetch on‑chain price
      const listing = await marketplace.listings(itemId);
      const priceFt = listing.price;
      const tx = await marketplace.buyNFT(itemId, { value: priceFt });
      await tx.wait();
      alert("✅ Purchase completed!");
    } catch (err) {
      console.error(err);
      alert("Purchase failed: " + (err.reason || err.message));
    } finally {
      setBuyingId(null);
    }
  };

  // Load Listings
  const loadListings = async () => {
    setIsLoadingListings(true);
    try {
      const items = [];
      const count = await marketplace.itemCount();
      for (let i = 1n; i <= count; i++) {
        const [seller, nftAddr, tokenId, priceFt] = await marketplace.listings(i);
        if (seller === ethers.ZeroAddress || tokenId === 0n) continue;
        let metadata = { name: "Unknown", description: "", image: "" };
        try {
          const uri = await nft.tokenURI(tokenId);
          const metaRes = await fetch(uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
          metadata = await metaRes.json();
        } catch {}
        items.push({ id: i, seller, tokenId, price: priceFt, metadata });
      }
      setListings(items);
    } catch (err) {
      console.error(err);
      alert("Failed to load listings");
    } finally {
      setIsLoadingListings(false);
    }
  };

  return (
    <div className="container">
      <h1>💠 Oasis NFT Marketplace</h1>

      <div className="connected-info">
        {account ? (
          <p>Connected: <strong>{account}</strong></p>
        ) : (
          <button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting
              ? <span className="spinner" />
              : "Connect Wallet"}
          </button>
        )}
      </div>

      <section>
        <h2>Mint New NFT</h2>
        <input type="text" placeholder="NFT Name" value={name} onChange={e => setName(e.target.value)} />
        <input type="text" placeholder="NFT Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        <button onClick={uploadAndMint} disabled={!account || isMinting}>
          {isMinting
            ? <span className="spinner" />
            : "Upload & Mint NFT"}
        </button>
      </section>

      <section>
        <h2>List NFT for Sale</h2>
        <input type="text" placeholder="Price in ETH" value={price} onChange={e => setPrice(e.target.value)} />
        <button onClick={listNFT} disabled={!account || !price || isListing}>
          {isListing
            ? <span className="spinner" />
            : "List NFT"}
        </button>
      </section>

      <section>
        <div className="list-header">
          <h2>Marketplace Listings</h2>
          <button onClick={loadListings} disabled={!account || isLoadingListings}>
            {isLoadingListings
              ? <span className="spinner" />
              : "Load Listings"}
          </button>
        </div>

        <div className="listings">
          {listings.map(item => (
            <div key={item.id.toString()} className="card">
              <img
                src={item.metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                alt={item.metadata.name}
              />
              <h3>{item.metadata.name}</h3>
              <p>{item.metadata.description}</p>
              <p className="price">
                Token ID: {item.tokenId.toString()} &bull; 
              </p>
              <p id="price-text">
              Price: <span className="highlight">{ethers.formatEther(item.price)} ETH</span>

              </p>
              <button onClick={() => buyNFT(item.id)} disabled={buyingId === item.id}>
                {buyingId === item.id
                  ? <span className="spinner" />
                  : "Buy NFT"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
