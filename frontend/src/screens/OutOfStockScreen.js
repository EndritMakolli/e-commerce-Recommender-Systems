// src/screens/OutOfStockScreen.js
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, ListGroup, Image, Button, Card, Badge } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { addToCart } from '../actions/cartActions'

// ✅ use the dynamic action
import { listRestockDynamic } from '../actions/recommendationActions'

function OutOfStockScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin || {}

  const myRecommendations = useSelector((state) => state.myRecommendations) || {}
  const { loading = false, error = null, items = [] } = myRecommendations

  const [justOneRow, setJustOneRow] = useState(false)

  // ✅ Dynamic refresh every 30 seconds
  useEffect(() => {
    if (!userInfo) return

    dispatch(listRestockDynamic(8))

    const interval = setInterval(() => {
      dispatch(listRestockDynamic(8))
    }, 30000)

    return () => clearInterval(interval)
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
    if (typeof p?.countInStock === 'number' && p.countInStock <= 3)
      return (
        <Badge bg="warning" text="dark">
          Low stock
        </Badge>
      )
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
            Based on your repeat purchases — we’ll show items you might need again (even if they’re
            currently out of stock).
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
            onClick={() => dispatch(listRestockDynamic(8))}
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
            <Link to="/" className="btn btn-outline-dark btn-sm">
              Browse products
            </Link>
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
                            {x?.reason ? (
                              <span style={{ marginLeft: 8, opacity: 0.75 }}>
                                {x.reason.includes('AI predicts') && (
                                  <Badge bg="primary" style={{ marginRight: 6, fontSize: 10, padding: '3px 8px' }}>
                                    🤖 AI
                                  </Badge>
                                )}
                                {x.reason}
                              </span>
                            ) : null}
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
                  If you don’t see anything yet, buy the same item at least twice.
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
  wrap: { maxWidth: 1140, margin: '0 auto', padding: '24px 16px', position: 'relative' },
  glow: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(600px 220px at 35% 15%, rgba(13,110,253,0.12), transparent 60%), radial-gradient(500px 200px at 75% 25%, rgba(0,0,0,0.06), transparent 60%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  hero: {
    position: 'relative',
    zIndex: 1,
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    border: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    gap: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12, opacity: 0.6 },
  title: { margin: 0, fontWeight: 800 },
  sub: { margin: '6px 0 0', opacity: 0.7, maxWidth: 540 },

  heroActions: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  pillBtn: { borderRadius: 999 },

  card: { borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)' },
  cardHeader: {
    background: '#fff',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardKicker: { textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12, opacity: 0.6 },
  cardTitle: { fontWeight: 800 },
  cardHint: { opacity: 0.6, fontSize: 12 },

  rowItem: { padding: 14 },
  imgWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#fff',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  nameLink: { fontWeight: 700, textDecoration: 'none', color: '#111' },
  metaLine: { marginTop: 6, fontSize: 12 },
  price: { fontWeight: 700 },
  actionsCell: { display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' },
  primaryBtn: { borderRadius: 999, paddingLeft: 14, paddingRight: 14 },
  secondaryBtn: { borderRadius: 999 },

  sideCard: { borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)' },
  sideTitle: { fontWeight: 800, marginBottom: 6 },
  sideText: { opacity: 0.75, fontSize: 13, lineHeight: 1.5 },
  divider: { height: 1, background: 'rgba(0,0,0,0.08)', margin: '14px 0' },
}

export default OutOfStockScreen
