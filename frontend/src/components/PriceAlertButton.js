import React, { useState, useEffect } from 'react'
import { Button, Modal, Form, Alert } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { createPriceAlert } from '../actions/priceAlertActions'
import { PRICE_ALERT_CREATE_RESET } from '../constants/priceAlertConstants'

function PriceAlertButton({ product }) {
  const [showModal, setShowModal] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [notifyAnyDrop, setNotifyAnyDrop] = useState(true)

  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const priceAlertCreate = useSelector((state) => state.priceAlertCreate)
  const { loading, success, error } = priceAlertCreate

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        setShowModal(false)
        dispatch({ type: PRICE_ALERT_CREATE_RESET })
      }, 2000)
    }
  }, [success, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const priceValue = notifyAnyDrop ? null : parseFloat(targetPrice)
    
    dispatch(createPriceAlert(product._id, priceValue, notifyAnyDrop))
  }

  if (!userInfo) {
    return null
  }

  return (
    <>
      <Button
        variant="outline-secondary"
        className="btn-block"
        onClick={() => setShowModal(true)}
        style={{
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          color: '#495057',
          fontWeight: '500',
          padding: '8px 16px',
          backgroundColor: '#fff',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa'
          e.currentTarget.style.borderColor = '#adb5bd'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff'
          e.currentTarget.style.borderColor = '#dee2e6'
        }}
      >
        <i className="fas fa-bell" style={{ marginRight: '6px', fontSize: '14px' }}></i>
        Watch Price
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '500', color: '#212529' }}>
            Set Price Alert
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {success && (
            <Alert variant="success" style={{ borderRadius: '6px', border: 'none', backgroundColor: '#d4edda', color: '#155724' }}>
              Price alert created successfully.
            </Alert>
          )}
          
          {error && <Alert variant="danger" style={{ borderRadius: '6px', border: 'none' }}>{error}</Alert>}

          <div style={{ marginBottom: '20px' }}>
            <h6 style={{ color: '#212529', marginBottom: '8px' }}>{product.name}</h6>
            <p style={{ fontSize: '18px', fontWeight: '500', color: '#212529', margin: 0 }}>
              Current Price: <span style={{ fontWeight: '600' }}>${product.price}</span>
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="notify-any-drop"
                label="Notify me on any price drop"
                checked={notifyAnyDrop}
                onChange={(e) => setNotifyAnyDrop(e.target.checked)}
                style={{ fontSize: '16px', fontWeight: '500' }}
              />
            </Form.Group>

            {!notifyAnyDrop && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '500' }}>
                  Target Price (Notify when price drops to or below)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder={`Enter target price (Current: $${product.price})`}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  required={!notifyAnyDrop}
                  max={product.price}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #dee2e6',
                    padding: '10px',
                  }}
                />
                <Form.Text className="text-muted">
                  Enter a price lower than ${product.price}
                </Form.Text>
              </Form.Group>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <Button
                variant="outline-secondary"
                onClick={() => setShowModal(false)}
                style={{ 
                  flex: 1, 
                  borderRadius: '6px', 
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  color: '#495057',
                  fontWeight: '500'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  borderRadius: '6px',
                  padding: '10px',
                  fontWeight: '500',
                  backgroundColor: '#212529',
                  border: 'none',
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bell" style={{ marginRight: '6px' }}></i>
                    Create Alert
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default PriceAlertButton
