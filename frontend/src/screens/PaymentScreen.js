import React, { useState, useEffect } from 'react'
import { Form, Button, Col, Card, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import FormContainer from '../components/FormContainer'
import CheckoutSteps from '../components/CheckoutSteps'
import { savePaymentMethod } from '../actions/cartActions'

function PaymentScreen() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  const [paymentMethod, setPaymentMethod] = useState('PayPal')

  useEffect(() => {
    if (!shippingAddress?.address) {
      navigate('/shipping')
    }
  }, [shippingAddress, navigate])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(savePaymentMethod(paymentMethod))
    navigate('/placeorder')
  }

  return (
    <FormContainer>
      <div style={s.stepsWrap}>
        <CheckoutSteps step1 step2 step3 />
      </div>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <div style={s.header}>
            <div style={s.kicker}>Checkout</div>
            <h2 style={s.title}>Payment</h2>
            <p style={s.subTitle}>Select a payment method to complete your order.</p>
          </div>

          <Form onSubmit={submitHandler}>
            <Form.Group>
              <Form.Label style={s.sectionLabel}>Payment method</Form.Label>

              <Row className="g-3">
                <Col xs={12}>
                  <div
                    style={{
                      ...s.option,
                      ...(paymentMethod === 'PayPal' ? s.optionActive : {}),
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentMethod('PayPal')}
                    onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('PayPal')}
                  >
                    <div style={s.optionLeft}>
                      <Form.Check
                        type="radio"
                        id="paypal"
                        name="paymentMethod"
                        value="PayPal"
                        checked={paymentMethod === 'PayPal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={s.radio}
                      />
                      <div>
                        <div style={s.optionTitle}>PayPal / Credit Card</div>
                        <div style={s.optionDesc}>
                          Pay with PayPal or any major credit/debit card.
                        </div>
                      </div>
                    </div>

                    <span style={s.badge}>Recommended</span>
                  </div>
                </Col>

                {/* Optional second method (uncomment if you want)
                <Col xs={12}>
                  <div
                    style={{
                      ...s.option,
                      ...(paymentMethod === 'Cash' ? s.optionActive : {}),
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentMethod('Cash')}
                    onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('Cash')}
                  >
                    <div style={s.optionLeft}>
                      <Form.Check
                        type="radio"
                        id="cash"
                        name="paymentMethod"
                        value="Cash"
                        checked={paymentMethod === 'Cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={s.radio}
                      />
                      <div>
                        <div style={s.optionTitle}>Cash on Delivery</div>
                        <div style={s.optionDesc}>Pay when your order arrives.</div>
                      </div>
                    </div>

                    <span style={s.badgeMuted}>Optional</span>
                  </div>
                </Col>
                */}
              </Row>
            </Form.Group>

            <div style={s.actions}>
              <Button type="submit" style={s.primaryBtn}>
                Continue →
              </Button>

              <div style={s.note}>
                <span style={s.lock}>🔒</span>
                Secure checkout
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </FormContainer>
  )
}

const s = {
  stepsWrap: {
    marginBottom: 16, // more breathing room under CheckoutSteps
  },

  card: {
    borderRadius: 18,
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 18px 45px rgba(0,0,0,0.10)',
    background: '#fff',
  },
  cardBody: {
    padding: 22,
  },

  header: {
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(0,0,0,0.55)',
  },
  title: {
    margin: '6px 0 4px 0',
    fontWeight: 800,
    letterSpacing: 0.2,
    color: '#111',
  },
  subTitle: {
    margin: 0,
    color: 'rgba(0,0,0,0.60)',
    fontSize: 14,
  },

  sectionLabel: {
    fontWeight: 700,
    color: '#111',
    marginBottom: 10,
  },

  option: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 14px',
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(0,0,0,0.02)',
    cursor: 'pointer',
    transition: 'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
  },
  optionActive: {
    borderColor: 'rgba(0,0,0,0.18)',
    boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
    transform: 'translateY(-1px)',
    background: 'rgba(0,0,0,0.03)',
  },
  optionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    margin: 0,
  },
  optionTitle: {
    fontWeight: 800,
    color: '#111',
    lineHeight: 1.1,
  },
  optionDesc: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.60)',
    marginTop: 4,
  },

  badge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0a0f12',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.10)',
    padding: '6px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  badgeMuted: {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(0,0,0,0.55)',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.08)',
    padding: '6px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },

  actions: {
    marginTop: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    borderRadius: 999,
    padding: '10px 16px',
    border: '1px solid rgba(0,0,0,0.10)',
    background: '#111',
    color: '#fff',
    fontWeight: 800,
  },
  note: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'rgba(0,0,0,0.55)',
    fontSize: 13,
  },
  lock: {
    opacity: 0.9,
  },
}

export default PaymentScreen
