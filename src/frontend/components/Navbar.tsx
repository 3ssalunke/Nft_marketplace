import { Nav, Navbar, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import market from "./market.png";

type Props = {
  web3Handler: React.MouseEventHandler;
  account: string | null;
};

const NavbarComp = ({ web3Handler, account }: Props) => {
  return (
    <Navbar expand="lg" bg="secondary" variant="dark">
      <Container>
        <Navbar.Brand href="http://www.dappuniversity.com/bootcamp">
          <img src={market} width="40" height="40" alt="brand" />
          &nbsp; 3S NFT Marketplace
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/create">
              Create
            </Nav.Link>
            <Nav.Link as={Link} to="/my-listed-items">
              My Listed Items
            </Nav.Link>
            <Nav.Link as={Link} to="/my-purchases">
              My Purchases
            </Nav.Link>
          </Nav>
          <Nav>
            {account ? (
              <Nav.Link>
                <Button className="button nav-button btn-sm mx-4">
                  {account.slice(0, 5) + "..." + account.slice(38, 42)}
                </Button>
              </Nav.Link>
            ) : (
              <Button onClick={web3Handler}>Connect Wallet</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComp;
