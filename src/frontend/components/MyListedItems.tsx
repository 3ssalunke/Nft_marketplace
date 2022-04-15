import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";

type Props = {
  marketplace: ethers.Contract | null;
  nft: ethers.Contract | null;
  account: string | null;
};

function renderSoldItems(items: any) {
  return (
    <>
      <h2>Sold</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item: any, idx: number) => {
          return (
            <Col key={idx} className="overflow-hidden">
              <Card>
                <Card.Img variant="top" src={item.image} />
                <Card.Footer>
                  For {ethers.utils.formatEther(item.price)} ETH - Recieved{" "}
                  {ethers.utils.formatEther(item.price)} ETH
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
}

const MyListedItems = ({ marketplace, nft, account }: Props) => {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState<Array<any>>([]);
  const [soldItems, setSoldItems] = useState<Array<any>>([]);

  const loadListedItems = async () => {
    const itemCount = await marketplace!.itemCount();
    let listedItems = [];
    let soldItems = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace!.items(i);
      if (item.seller.toLowerCase() === account) {
        const uri = await nft!.tokenURI(item.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketplace!.getTotalPrice(item.itemId);
        let _item = {
          totalPrice,
          price: item.price,
          itemId: item.itemId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
        };
        listedItems.push(_item);
        if (item.sold) soldItems.push(_item);
      }
    }
    setLoading(false);
    setListedItems(listedItems);
    setSoldItems(soldItems);
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  if (loading)
    return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    );

  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ? (
        <div className="px-5 py-3 container">
          <h2>Listed</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
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
          {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
      ) : (
        <main style={{ padding: "1rem 0" }}>
          <h2>No listed assets</h2>
        </main>
      )}
    </div>
  );
};

export default MyListedItems;
