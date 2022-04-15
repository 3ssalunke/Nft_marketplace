import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";

type Props = {
  marketplace: ethers.Contract | null;
  nft: ethers.Contract | null;
};

const Home = ({ marketplace, nft }: Props) => {
  const [items, setItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  const loadMarketPlaceItems = async () => {
    const itemCount = await marketplace?.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace?.items(i);
      if (!item.sold) {
        //get uri url from nft contract
        const uri = await nft?.tokenURI(item.tokenId);
        //use uri to fetch nft metadata stored to ipfs
        const response = await fetch(uri);
        const metadata = await response.json();
        //get total price of item
        const totalPrice = await marketplace?.getTotalPrice(item.itemId);
        //add item to items array
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
        });
      }
    }
    setItems([...items]);
    setLoading(false);
  };

  const buyMarketItem = async (item: any) => {
    await (
      await marketplace?.purchaseItem(item.itemId, { value: item.totalPrice })
    ).wait();
    loadMarketPlaceItems();
  };

  useEffect(() => {
    loadMarketPlaceItems();
  }, []);

  if (loading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      {items.length ? (
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {items.map((item, index) => (
              <Col key={index} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body color="secondary">
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>{item.description}</Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-grid">
                      <Button
                        onClick={() => buyMarketItem(item)}
                        variant="primary"
                        size="lg"
                      >
                        Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <main style={{ padding: "1rem 0" }}>
          <h2>No listed assets</h2>
        </main>
      )}
    </div>
  );
};

export default Home;
