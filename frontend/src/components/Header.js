// src/components/Header.js
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { logout } from '../actions/userActions'
import SearchBox from '../components/SearchBox'

function Header() {
  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const logoutHandler = () => dispatch(logout())
  const isAdmin = !!userInfo?.isAdmin

  return (
    <>
      <header style={s.headerWrap}>
        <div style={s.fade} />

        <Navbar
          expand="lg"
          collapseOnSelect
          variant="dark"
          style={{
            ...s.navbar,
            ...(scrolled ? s.navbarScrolled : {}),
          }}
        >
          <Container style={s.container}>
            {/* LEFT */}
            <LinkContainer to="/">
              <Navbar.Brand style={s.brand}>ProShop</Navbar.Brand>
            </LinkContainer>

            <Navbar.Toggle aria-controls="main-nav" style={s.toggle} />

            <Navbar.Collapse id="main-nav">
              {/* CENTER NAV */}
              <Nav style={s.centerNav} className="mx-auto">
                {!isAdmin ? (
                  <>
                    <LinkContainer to="/">
                      <Nav.Link style={s.navLink}>Home</Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/">
                      <Nav.Link style={s.navLink}>Shop</Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/outofstock">
                      <Nav.Link style={s.navLink}>Out of Stock</Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/visual-search">
                      <Nav.Link style={s.navLink}>🖼️ Visual Search</Nav.Link>
                    </LinkContainer>
                  </>
                ) : (
                  <>
                    <LinkContainer to="/admin/userlist">
                      <Nav.Link style={s.navLink}>Users</Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/admin/productlist">
                      <Nav.Link style={s.navLink}>Products</Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/admin/orderlist">
                      <Nav.Link style={s.navLink}>Orders</Nav.Link>
                    </LinkContainer>
                  </>
                )}
              </Nav>

              {/* RIGHT */}
              <div style={s.rightArea}>
                {/* ✅ Imported SearchBox with the good design */}
                <SearchBox />

                <div style={s.rightSpacer} />

                {/* Profile */}
                <div style={s.slot}>
                  {userInfo ? (
                    <NavDropdown
                      title={
                        <span style={s.pillInline}>
                          <i className="fas fa-user" style={s.faIcon} />
                          {userInfo.name}
                        </span>
                      }
                      id="account"
                      menuVariant="dark"
                      align="end"
                    >
                      <LinkContainer to="/profile">
                        <NavDropdown.Item>Profile</NavDropdown.Item>
                      </LinkContainer>

                      <LinkContainer to="/orders">
                        <NavDropdown.Item>My Orders</NavDropdown.Item>
                      </LinkContainer>

                      <NavDropdown.Divider />

                      <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                    </NavDropdown>
                  ) : (
                    <LinkContainer to="/login">
                      <Nav.Link style={s.pill}>
                        <i className="fas fa-user" style={s.faIcon} />
                        Login
                      </Nav.Link>
                    </LinkContainer>
                  )}
                </div>

                {/* <div style={s.rightSpacerSmall} /> */}

                {/* Cart (WHITE) */}
                <div style={s.slot}>
                  <LinkContainer to="/cart">
                    <Nav.Link style={s.cartWhite}>
                      <i className="fas fa-shopping-cart" style={s.cartIcon} />
                      Cart
                    </Nav.Link>
                  </LinkContainer>
                </div>
              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      <div style={s.pageTopSpacing} />
    </>
  )
}

const s = {
  headerWrap: {
    position: 'sticky',
    top: 0,
    zIndex: 1020,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    height: 34,
    pointerEvents: 'none',
    background: 'linear-gradient(to bottom, rgba(10,15,18,0.55), rgba(10,15,18,0))',
  },

  navbar: {
    background: 'rgba(10, 15, 18, 0.82)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 16,
    paddingBottom: 16,
    transition: 'all 180ms ease',
  },
  navbarScrolled: {
    background: 'rgba(10, 15, 18, 0.92)',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },

  container: {
    gap: 18,
  },

  brand: {
    fontWeight: 900,
    letterSpacing: 0.5,
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    paddingRight: 6,
  },

  toggle: {
    borderColor: 'rgba(255,255,255,0.18)',
  },

  centerNav: {
    gap: 10,
    alignItems: 'center',
  },
  navLink: {
    color: 'rgba(255,255,255,0.86)',
    padding: '10px 14px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },

  rightArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },

  rightSpacer: {
    width: 34,
  },
  rightSpacerSmall: {
    width: 26,
  },

  slot: {
    display: 'flex',
    alignItems: 'center',
  },

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  pillInline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
  },

  cartWhite: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 999,
    background: '#ffffff',
    color: '#0a0f12',
    border: '1px solid rgba(255,255,255,0.65)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
  },
  cartIcon: {
    opacity: 0.95,
  },

  faIcon: {
    opacity: 0.9,
  },

  pageTopSpacing: {
    height: 18,
  },
}

export default Header
