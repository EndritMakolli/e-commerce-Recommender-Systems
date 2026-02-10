import React, { useEffect } from 'react'
import { Table, Button, Badge, Card, Row, Col } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { listMyPriceAlerts, deletePriceAlert } from '../actions/priceAlertActions'

function PriceAlertsScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const priceAlertList = useSelector((state) => state.priceAlertList)
  const { loading, error, alerts, count } = priceAlertList

  const priceAlertDelete = useSelector((state) => state.priceAlertDelete)
  const { success: successDelete } = priceAlertDelete

  useEffect(() => {
    if (!userInfo) {
      navigate('/login')
    } else {
      dispatch(listMyPriceAlerts())
    }
  }, [dispatch, navigate, userInfo, successDelete])

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this price alert?')) {
      dispatch(deletePriceAlert(id))
    }
  }

  return (
    <div>
      <Row className="align-items-center mb-4">
        <Col>
          <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#212529', marginBottom: '8px' }}>
            Price Alerts
          </h1>
          {alerts && alerts.length > 0 && (
            <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
              {count} active alert{count !== 1 ? 's' : ''}
            </p>
          )}
        </Col>
      </Row>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !alerts || alerts.length === 0 ? (
        <Card style={{ borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: 'none' }}>
          <Card.Body style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-bell-slash" style={{ fontSize: '48px', color: '#adb5bd', marginBottom: '16px' }}></i>
            <h4 style={{ color: '#495057', marginBottom: '8px' }}>No Price Alerts</h4>
            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>
              Start watching products to get notified when prices drop.
            </p>
            <LinkContainer to="/">
              <Button variant="outline-dark" style={{ borderRadius: '6px', padding: '8px 20px', fontSize: '14px' }}>
                Browse Products
              </Button>
            </LinkContainer>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Table hover responsive style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
              <tr>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Product</th>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Price</th>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Alert Type</th>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Status</th>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Created</th>
                <th style={{ fontWeight: '500', color: '#495057', fontSize: '13px', padding: '12px', border: 'none' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {alert.product.image && (
                        <img
                          src={alert.product.image}
                          alt={alert.product.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef',
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                          {alert.product.name}
                        </div>
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>{alert.product.category}</small>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px', border: 'none' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#212529' }}>
                      ${alert.product.current_price}
                    </span>
                  </td>

                  <td style={{ padding: '12px', border: 'none' }}>
                    {alert.notify_any_drop ? (
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Any drop</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>
                        Target: ${alert.target_price}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '12px', border: 'none' }}>
                    {alert.price_dropped ? (
                      <span style={{ fontSize: '13px', color: '#212529', fontWeight: '500' }}>Price dropped</span>
                    ) : alert.product.countInStock === 0 ? (
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Out of stock</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>Watching</span>
                    )}
                  </td>

                  <td style={{ padding: '12px', border: 'none', color: '#6c757d', fontSize: '13px' }}>
                    {new Date(alert.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  <td style={{ padding: '12px', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <LinkContainer to={`/product/${alert.product.id}`}>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          style={{ 
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                            fontSize: '12px',
                            padding: '4px 10px'
                          }}
                        >
                          View
                        </Button>
                      </LinkContainer>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => deleteHandler(alert.id)}
                        style={{ 
                          borderRadius: '4px',
                          border: '1px solid #dee2e6',
                          fontSize: '12px',
                          padding: '4px 10px',
                          color: '#dc3545'
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  )
}

export default PriceAlertsScreen
