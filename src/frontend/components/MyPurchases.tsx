import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";

type Props = {
  marketplace: ethers.Contract | null;
  nft: ethers.Contract | null;
  account: string | null;
};

const MyPurchases = ({ marketplace, nft, account }: Props) => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Array<any>>([]);

  const loadPurchasedItems = async () => {
    // Fetch purchased items from marketplace by quering Offered events with the buyer set as the user
    const filter = marketplace!.filters.Bought(
      null,
      null,
      null,
      null,
      null,
      account
    );
    const results = await marketplace!.queryFilter(filter);
    //Fetch metadata of each nft and add that to listedItem object.
    const _purchases = await Promise.all(
      results.map(async (e) => {
        // fetch arguments from each result
        let i = e.args;
        console.log(i);
        // get uri url from nft contract
        const uri = await nft!.tokenURI(+i!.tokenId.toString());
        console.log(uri);
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri);
        const metadata = await response.json();
        console.log(metadata);
        // get total price of item (item price + fee)
        const totalPrice = await marketplace!.getTotalPrice(i!.itemId);
        console.log(totalPrice);
        // define listed item object
        let purchasedItem = {
          totalPrice,
          price: i!.price,
          itemId: i!.itemId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
        };
        return purchasedItem;
      })
    );
    setLoading(false);
    setPurchases(_purchases);
  };

  useEffect(() => {
    loadPurchasedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      {purchases.length > 0 ? (
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <main style={{ padding: "1rem 0" }}>
          <h2>No purchases</h2>
        </main>
      )}
    </div>
  );
};

export default MyPurchases;
