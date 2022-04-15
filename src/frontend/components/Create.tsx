import { ethers } from "ethers";
import { FormEvent, useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { AddResult } from "ipfs-core-types/src/root";
import { Button, Form, Row } from "react-bootstrap";

type Props = {
  marketplace: ethers.Contract | null;
  nft: ethers.Contract | null;
};

const client = ipfsHttpClient({ url: "https://ipfs.infura.io:5001/api/v0" });

const Create = ({ marketplace, nft }: Props) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const uploadToIPFS = async (event: FormEvent) => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      files: Array<any>;
    };
    const file = target.files[0];
    if (typeof file !== "undefined") {
      try {
        const result = await client.add(file);
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const createNFT = async () => {
    if (!name || !image || !price || !description) return;
    try {
      const result = await client.add(
        JSON.stringify({ image, name, description })
      );
      mintThenList(result);
    } catch (error) {
      console.log("ipfs uri upload error: ", error);
    }
  };

  const mintThenList = async (result: AddResult) => {
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`;
    //mint nft
    await (await nft?.mint(uri)).wait();
    //get tokenId of new nft
    const id = await nft?.tokenCount();
    //approve nft to spend marketplace
    await (await nft?.setApprovalForAll(marketplace?.address, true)).wait();
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price!.toString());
    await (await marketplace?.makeItem(nft?.address, id, listingPrice)).wait();
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main
          role="main"
          className="col-lg-12 mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control
                onChange={(e) => setName(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Name"
              />
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                as="textarea"
                placeholder="Description"
              />
              <Form.Control
                onChange={(e) => setPrice(e.target.value)}
                size="lg"
                required
                type="number"
                placeholder="Price in ETH"
              />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Create;
