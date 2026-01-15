import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaTwitter, FaGithub } from 'react-icons/fa'

function Footer() {
  return (
    <footer style={styles.footer}>
      <Container>
        <Row className="py-4">

          {/* Brand */}
          <Col md={4} className="mb-3">
            <h4 style={styles.logo}>E-Commerce</h4>
            <p style={styles.text}>
              Premium shopping experience. Secure payments. Fast delivery.
            </p>
          </Col>

          {/* Links */}
          <Col md={4} className="mb-3">
            <h5 style={styles.title}>Quick Links</h5>
            <ul style={styles.list}>
              <li><Link style={styles.link} to="/">Home</Link></li>
              <li><Link style={styles.link} to="/cart">Cart</Link></li>
              <li><Link style={styles.link} to="/login">Login</Link></li>
              <li><Link style={styles.link} to="/register">Register</Link></li>
            </ul>
          </Col>

          {/* Social */}
          <Col md={4} className="mb-3 text-center">
            <h5 style={styles.title}>Follow Us</h5>
            <div>
              <FaFacebook style={styles.icon} />
              <FaInstagram style={styles.icon} />
              <FaTwitter style={styles.icon} />
              <FaGithub style={styles.icon} />
            </div>
          </Col>

        </Row>

        <Row>
          <Col className="text-center pt-3" style={styles.copy}>
            © {new Date().getFullYear()} E-Commerce | All Rights Reserved
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

const styles = {
  footer: {
    background: 'linear-gradient(135deg, #484e57, #2b2e31, #1e2122)',
    color: '#fff',
    marginTop: '60px'
  },
  logo: {
    fontWeight: '700',
    letterSpacing: '1px'
  },
  title: {
    marginBottom: '15px',
    fontWeight: '600'
  },
  text: {
    color: '#d1d1d1'
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  link: {
    color: '#d1d1d1',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '8px'
  },
  icon: {
    fontSize: '26px',
    margin: '10px',
    cursor: 'pointer',
    color: '#ffffff',
    transition: '0.3s'
  },
  copy: {
    borderTop: '1px solid rgba(255, 255, 255, 0.07)',
    marginTop: '20px',
    paddingBottom: '20px',
    color: '#ccc'
  }
}

export default Footer
