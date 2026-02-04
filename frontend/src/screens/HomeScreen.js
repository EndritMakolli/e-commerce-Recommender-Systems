import React, { useEffect } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Paginate from '../components/Paginate'
import RecommendedSlider from '../components/RecommendedSlider'

import { listProducts } from '../actions/productActions'
import { listMyRecommendations } from '../actions/recommendationActions'

function HomeScreen() {
  const dispatch = useDispatch()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const keyword = params.get('keyword') || ''
  const pageNumber = Number(params.get('page') || 1)
  const semantic = params.get('semantic') === '1'

  const productList = useSelector((state) => state.productList) || {}
  const { loading, error, products, pages = 1, page = 1 } = productList

  const userLogin = useSelector((state) => state.userLogin) || {}
  const { userInfo } = userLogin

  const myRecommendations = useSelector((state) => state.myRecommendations) || {}
  const { loading: recLoading, error: recError, items: recItems = [] } = myRecommendations

  // 🔥 Trigger refetch after order actions (create/pay/deliver/admin list etc.)
  // Use whichever reducers exist in your store — missing ones are safely handled.
  const orderCreate = useSelector((state) => state.orderCreate) || {}
  const { success: orderCreateSuccess } = orderCreate

  const orderPay = useSelector((state) => state.orderPay) || {}
  const { success: orderPaySuccess } = orderPay

  const orderDeliver = useSelector((state) => state.orderDeliver) || {}
  const { success: orderDeliverSuccess } = orderDeliver

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber, semantic))

    // Only show/fetch recs on page 1, no search, and when logged in
    if (!keyword && pageNumber === 1 && userInfo) {
      // pass a number if your action accepts topn, otherwise ignore it
      dispatch(listMyRecommendations(8))
    }
  }, [
    dispatch,
    keyword,
    pageNumber,
    semantic,
    userInfo,
    orderCreateSuccess,
    orderPaySuccess,
    orderDeliverSuccess,
  ])

  const safeProducts = Array.isArray(products) ? products : []
  const safeRecs = Array.isArray(recItems) ? recItems : []

  const showRecs = !keyword && pageNumber === 1 && userInfo

  return (
    <div>
      {showRecs && (
        <>
          {recLoading ? null : recError ? (
            <Message variant="warning">{recError}</Message>
          ) : safeRecs.length > 0 ? (
            <RecommendedSlider items={safeRecs} title="Recommended for you" />
          ) : null}
        </>
      )}

      {keyword && semantic && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,110,253,0.1), rgba(140,90,255,0.1))',
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
          border: '1px solid rgba(13,110,253,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>AI-Powered Search Active</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Finding products by meaning, not just keywords. Searching for: "{keyword}"
            </div>
          </div>
        </div>
      )}

      <h1>Latest Products</h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Row>
            {safeProducts.map((product) => (
              <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
                <Product product={product} />
              </Col>
            ))}
          </Row>

          <Paginate pages={pages} page={page} keyword={keyword} />
        </>
      )}
    </div>
  )
}

export default HomeScreen
