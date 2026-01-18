// src/screens/OutOfStockScreen.js
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, ListGroup, Image, Button, Card, Badge } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { addToCart } from '../actions/cartActions'
import { listMyRecommendations } from '../actions/recommendationActions'

function OutOfStockScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin || {}

  const recommendationList = useSelector((state) => state.recommendationList) || {}
  const { loading = false, error = null, items = [] } = recommendationList

  const [justOneRow, setJustOneRow] = useState(false)

  useEffect(() => {
    if (userInfo) {
      dispatch(listMyRecommendations('restock'))
    }
  }, [dispatch, userInfo])

  const safeItems = useMemo(() => {
    const arr = Array.isArray(items) ? items : []
    return arr
      .map((x) => (x && x.product ? x : { product: x }))
      .filter((x) => x.product)
      .slice(0, justOneRow ? 4 : 9999)
  }, [items, justOneRow])

  const addHandler = (productId, qty = 1) => {
    dispatch(addToCart(productId, qty))
    navigate('/cart')
  }

  const stockBadge = (p) => {
    if (p?.countInStock === 0) return <Badge bg="danger">Out of stock</Badge>
    if (typeof p?.countInStock === 'number' && p.countInStock <= 3) return <Badge bg="warning" text="dark">Low stock</Badge>
    return <Badge bg="success">In stock</Badge>
  }

  if (!userInfo) {
    return (
      <div style={s.wrap}>
        <div style={s.hero}>
          <div>
            <div style={s.kicker}>Restock assistant</div>
            <h2 style={s.title}>Restock & Availability</h2>
            <p style={s.sub}>
              Sign in to see items you may need again — including items currently out of stock.
            </p>
          </div>

          <div style={s.heroActions}>
            <Link to="/login" className="btn btn-dark">
              Sign In
            </Link>
            <Link to="/" className="btn btn-outline-dark">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.glow} />

      <div style={s.hero}>
        <div>
          <div style={s.kicker}>Restock assistant</div>
          <h2 style={s.title}>Restock & Availability</h2>
          <p style={s.sub}>
            Based on your repeat purchases — we’ll show items you might need again (even if they’re currently out of stock).
          </p>
        </div>

        <div style={s.heroActions}>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => setJustOneRow((v) => !v)}
            style={s.pillBtn}
          >
            {justOneRow ? 'Show all' : 'Show top 4'}
          </Button>

          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => dispatch(listMyRecommendations('restock'))}
            style={s.pillBtn}
          >
            Refresh
          </Button>

          <Link to="/" className="btn btn-dark btn-sm">
            Continue shopping
          </Link>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : safeItems.length === 0 ? (
        <Message variant="info">
          No suggestions yet. Place a couple of orders (repeat the same item at least twice) then refresh.
          <div style={{ marginTop: 8 }}>
            <Link to="/" className="btn btn-outline-dark btn-sm">Browse products</Link>
          </div>
        </Message>
      ) : (
        <Row>
          <Col md={8}>
            <Card style={s.card}>
              <Card.Header style={s.cardHeader}>
                <div>
                  <div style={s.cardKicker}>Predicted reorders</div>
                  <div style={s.cardTitle}>Items you may need again</div>
                </div>
                <div style={s.cardHint}>These improve as you place more orders</div>
              </Card.Header>

              <ListGroup variant="flush">
                {safeItems.map((x) => {
                  const p = x.product
                  return (
                    <ListGroup.Item key={p._id} style={s.rowItem}>
                      <Row className="align-items-center">
                        <Col md={2}>
                          <div style={s.imgWrap}>
                            <Image src={p.image} alt={p.name} style={s.img} />
                          </div>
                        </Col>

                        <Col md={4}>
                          <Link to={`/product/${p._id}`} style={s.nameLink}>
                            {p.name}
                          </Link>
                          <div style={s.metaLine}>
                            {stockBadge(p)}
                            {x?.reason ? <span style={{ marginLeft: 8, opacity: 0.75 }}>{x.reason}</span> : null}
                          </div>
                        </Col>

                        <Col md={2} style={s.price}>
                          ${Number(p.price).toFixed(2)}
                        </Col>

                        <Col md={4} style={s.actionsCell}>
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={() => addHandler(p._id, 1)}
                            style={s.primaryBtn}
                            disabled={p.countInStock === 0}
                          >
                            {p.countInStock === 0 ? 'Out of stock' : 'Reorder'}
                          </Button>

                          <Link
                            to={`/product/${p._id}`}
                            className="btn btn-outline-dark btn-sm"
                            style={s.secondaryBtn}
                          >
                            View
                          </Link>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )
                })}
              </ListGroup>
            </Card>
          </Col>

          <Col md={4}>
            <Card style={s.sideCard}>
              <Card.Body>
                <div style={s.sideTitle}>How this works</div>
                <div style={s.sideText}>
                  We detect repeat purchases and estimate when you might need the item again.
                  Out-of-stock items can still appear here so you can track what you’re waiting for.
                </div>

                <div style={s.divider} />

                <div style={s.sideTitle}>Tip</div>
                <div style={s.sideText}>
                  If you don’t see anything yet, buy the same item at least twice (test orders are fine).
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

const s = {
  wrap: { position: 'relative', paddingTop: 6 },
  glow: {
    position: 'absolute',
    inset: '-20px -20px auto -20px',
    height: 220,
    background:
      'radial-gradient(650px 220px at 22% 50%, rgba(0, 200, 255, 0.15), rgba(0,0,0,0)),' +
      'radial-gradient(650px 220px at 78% 55%, rgba(140, 90, 255, 0.13), rgba(0,0,0,0))',
    filter: 'blur(10px)',
    pointerEvents: 'none',
  },
  hero: {
    position: 'relative',
    borderRadius: 18,
    padding: '16px 18px',
    marginBottom: 18,
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 14px 40px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  kicker: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.65, marginBottom: 2 },
  title: { margin: 0, fontWeight: 900, letterSpacing: 0.6 },
  sub: { margin: '6px 0 0 0', opacity: 0.75, maxWidth: 560 },
  heroActions: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  pillBtn: { borderRadius: 999 },

  card: { borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 14px 40px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardHeader: {
    background: 'rgba(255,255,255,0.85)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  cardKicker: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.6 },
  cardTitle: { fontWeight: 900, letterSpacing: 0.5 },
  cardHint: { fontSize: 12, opacity: 0.6 },

  rowItem: { paddingTop: 14, paddingBottom: 14 },

  imgWrap: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%', objectFit: 'contain' },

  nameLink: { textDecoration: 'none', fontWeight: 800, color: '#0a0f12', display: 'inline-block', lineHeight: 1.2 },
  metaLine: { marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 },

  price: { fontWeight: 900, opacity: 0.9 },

  actionsCell: { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  primaryBtn: { borderRadius: 999, paddingLeft: 14, paddingRight: 14 },
  secondaryBtn: { borderRadius: 999 },

  sideCard: { borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 14px 40px rgba(0,0,0,0.08)' },
  sideTitle: { fontWeight: 900, marginBottom: 6 },
  sideText: { opacity: 0.75, fontSize: 13, lineHeight: 1.5 },
  divider: { height: 1, background: 'rgba(0,0,0,0.08)', margin: '14px 0' },
}

export default OutOfStockScreen
