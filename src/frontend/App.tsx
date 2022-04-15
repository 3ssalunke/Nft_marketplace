import { ethers } from "ethers";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import MarketplaceAddress from "./contractsData/Marketplace-address.json";
import Marketplace from "./contractsData/Marketplace.json";
import NftAddress from "./contractsData/NFT-address.json";
import Nft from "./contractsData/NFT.json";
import NavbarComp from "./components/Navbar";
import Home from "./components/Home";
import Create from "./components/Create";
import MyListedItems from "./components/MyListedItems";
import MyPurchases from "./components/MyPurchases";
import "./App.css";

declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}

const App: React.FC<{}> = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);
  const [marketplace, setMarketplace] = useState<ethers.Contract | null>(null);
  const [nft, setNft] = useState<ethers.Contract | null>(null);
  // Metamask Login/Connectd
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
    //Get provider for metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //Set signer
    const signer = provider.getSigner();

    loadContracts(signer);
  };

  const loadContracts = (signer: ethers.providers.JsonRpcSigner) => {
    //Get deployed copies of contracts
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      Marketplace.abi,
      signer
    );
    setMarketplace(marketplace);
    const nft = new ethers.Contract(NftAddress.address, Nft.abi, signer);
    setNft(nft);
    setLoading(false);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <NavbarComp web3Handler={web3Handler} account={account} />
        {loading ? (
          <div
            style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}
          >
            <Spinner animation="border" style={{ display: "flex" }} />
            <p className="mx-3 my-0">Awaiting Metamask Connection...</p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={<Home marketplace={marketplace} nft={nft} />}
            />
            <Route
              path="/create"
              element={<Create marketplace={marketplace} nft={nft} />}
            />
            <Route
              path="/my-listed-items"
              element={
                <MyListedItems
                  marketplace={marketplace}
                  nft={nft}
                  account={account}
                />
              }
            />
            <Route
              path="/my-purchases"
              element={
                <MyPurchases
                  marketplace={marketplace}
                  nft={nft}
                  account={account}
                />
              }
            />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
