import React, { useEffect } from 'react'
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { getSmartPricing } from '../actions/priceAlertActions'

function SmartPricingBadge({ productId, currentPrice }) {
  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const smartPricing = useSelector((state) => state.smartPricing)
  const { pricing } = smartPricing

  useEffect(() => {
    if (userInfo && productId) {
      dispatch(getSmartPricing(productId))
    }
  }, [dispatch, userInfo, productId])

  // Only show when we have pricing for this exact product (avoid stale data from another product)
  const discount = pricing?.suggested_discount
  const matchProduct =
    productId != null &&
    pricing?.product_id != null &&
    String(pricing.product_id) === String(productId)

  // Show badge if we have valid discount data
  const shouldShow =
    userInfo &&
    pricing &&
    discount != null &&
    Number(discount) > 0 &&
    (matchProduct || !pricing.product_id)

  if (!shouldShow) {
    return null
  }

  const renderTooltip = (props) => (
    <Tooltip id="pricing-tooltip" {...props}>
      <div style={{ textAlign: 'left', fontSize: '12px' }}>
        <strong>AI Recommendation</strong>
        <br />
        <small>{pricing.reason}</small>
        <br />
        <br />
        <strong>Signals:</strong>
        <br />
        <small>Views: {pricing.user_signals?.view_count || 0}</small>
        <br />
        <small>Confidence: {Math.round((pricing.confidence || 0) * 100)}%</small>
      </div>
    </Tooltip>
  )

  return (
    <div style={{ display: 'block', marginTop: '8px' }}>
      <OverlayTrigger placement="top" overlay={renderTooltip}>
        <Badge
          bg=""
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            cursor: 'pointer',
            backgroundColor: '#ebb434',
            border: '1px solid #ebb434',
            fontWeight: '600',
            color: '#000',
            display: 'inline-block',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(88, 88, 88, 0.3)',
          }}
        >
          AI: {pricing.suggested_discount}% OFF — ${pricing.suggested_price}
        </Badge>
      </OverlayTrigger>
    </div>
  )
}

export default SmartPricingBadge
