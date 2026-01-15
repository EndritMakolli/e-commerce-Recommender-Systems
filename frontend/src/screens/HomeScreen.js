import React, { useEffect } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { listProducts } from '../actions/productActions'


function HomeScreen(history) {
  const dispatch = useDispatch()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const keyword = params.get('keyword') || ''
  const pageNumber = params.get('page') || ''

  const productList = useSelector((state) => state.productList) || {}
  const { loading, error, products } = productList

  

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber))
  }, [dispatch, keyword, pageNumber])

  const safeProducts = Array.isArray(products) ? products : []

  return (
    <div>
      <h1>Latest Products</h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          {safeProducts.map((product) => (
            <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
              <Product product={product} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default HomeScreen
