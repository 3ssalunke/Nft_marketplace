const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", async function () {
  let deployer,
    addr1,
    addr2,
    nft,
    marketplace,
    addrs,
    feePercent = 1,
    URI = "Sample URI";

  beforeEach(async function () {
    const NFT = await ethers.getContractFactory("NFT");
    const Marketplace = await ethers.getContractFactory("Marketplace");

    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });

  describe("deployment", function () {
    it("Should track name and symbol of nft collection", async function () {
      expect(await nft.name()).to.equal("3s NFT");
      expect(await nft.symbol()).to.equal("3S");
    });

    it("Should track feeAccount and feePercent of marketplace", async function () {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("Minting NFTs", async function () {
    it("Should track each minted NFT", async function () {
      await nft.connect(addr1).mint(URI);
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);

      await nft.connect(addr2).mint(URI);
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });

  describe("Making marketplace items", function () {
    beforeEach(async function () {
      //addr1 mints an nft
      await nft.connect(addr1).mint(URI);
      //addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });

    it("Should track newly created item, transfer NFT from seller to marketplace and emit offered event", async function () {
      //addr1 offers their nft at a price of 1 ether
      expect(
        await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(1))
      )
        .to.emit(marketplace, "Offered")
        .withArgs(1, nft.address, 1, toWei(1), addr1.address);
      //Owner of the nft should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      //Item count should now equal 1
      expect(await marketplace.itemCount()).to.equal(1);
      //Get item from items mapping then check fields to ensure they are correct
      const item = await marketplace.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(1));
      expect(item.sold).to.equal(false);
    });

    it("Should fail if price is set to zero", async function () {
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("Purchasing marketplace items", async function () {
    let price = 2;
    const fee = (feePercent / 100) * price;
    let totalPriceInWei;
    beforeEach(async function () {
      //addr1 mints an nft
      await nft.connect(addr1).mint(URI);
      //addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
      //addr1 makes their nft marketplace item
      await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price));
    });

    it("Should update item as sold, pay seller, transfer nft to buyer, charge fess and emit a bought event", async function () {
      const sellerInitialBal = await addr1.getBalance();
      const feeAccountInitialBal = await deployer.getBalance();
      //fetch items total price(market fees + item price)
      totalPriceInWei = await marketplace.getTotalPrice(1);
      //addr2 purchases item
      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })
      )
        .to.emit(marketplace, "Bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        );
      const sellerFinalBal = await addr1.getBalance();
      const feeAccountFinalBal = await deployer.getBalance();
      //Seller should receive payment for the NFT sold
      expect(+fromWei(sellerFinalBal)).to.equal(
        +price + +fromWei(sellerInitialBal)
      );
      //Feeacoount should receive fee charges
      expect(+fromWei(feeAccountFinalBal)).to.equal(
        +fee + +fromWei(feeAccountInitialBal)
      );
      //the addr2 should now be the owner of nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      // fails for invalid item ids
      await expect(
        marketplace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
      ).to.be.revertedWith("Item does not exist");
      await expect(
        marketplace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
      ).to.be.revertedWith("Item does not exist");
      // Fails when not enough ether is paid with the transaction.
      // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      // not the additional market fee.
      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
      ).to.be.revertedWith(
        "Not enough ether to cover item price and market fee"
      );
      // addr2 purchases item 1
      await marketplace
        .connect(addr2)
        .purchaseItem(1, { value: totalPriceInWei });
      // addr3 tries purchasing item 1 after its been sold
      const addr3 = addrs[0];
      await expect(
        marketplace.connect(addr3).purchaseItem(1, { value: totalPriceInWei })
      ).to.be.revertedWith("Item already sold");
    });
  });
});
