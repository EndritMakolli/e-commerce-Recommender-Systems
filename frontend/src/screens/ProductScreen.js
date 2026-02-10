import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Image, ListGroup, Card, Button, Form } from 'react-bootstrap'
import Rating from '../components/Rating'
import { useDispatch, useSelector } from 'react-redux'
import { listProductDetails, createProductReview, listRelatedProducts } from '../actions/productActions'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Product from '../components/Product'
import PriceAlertButton from '../components/PriceAlertButton'
import SmartPricingBadge from '../components/SmartPricingBadge'
import { trackProductEvent } from '../utils/trackProductEvent'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'

function ProductScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [qty, setQty] = useState(1)

  // Review form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  // User info
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin || {}

  // Product details
  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  // Review create state
  const productReviewCreate = useSelector((state) => state.productReviewCreate)
  const {
    loading: loadingProductReview,
    error: errorProductReview,
    success: successProductReview,
  } = productReviewCreate

  // Related products (Frequently Bought Together)
  const productRelated = useSelector((state) => state.productRelated)
  const { loading: loadingRelated, recommendations: relatedProducts } = productRelated

  useEffect(() => {
    if (successProductReview) {
      setRating(0)
      setComment('')
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
    }

    dispatch(listProductDetails(id))
    dispatch(listRelatedProducts(id))
  }, [dispatch, id, successProductReview])

  // Track product view event
  useEffect(() => {
    if (product && userInfo && userInfo.token) {
      trackProductEvent(product._id, 'view', userInfo.token)
    }
  }, [product, userInfo])

  const addToCartHandler = () => {
    navigate(`/cart/${id}?qty=${qty}`)
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(createProductReview(id, { rating, comment }))
  }

  return (
    <div>
      <Link to="/" className="btn btn-light my-3">
        Go Back
      </Link>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <Row>
            <Col md={6}>
            <div style={styles.imageWrap}>
              <Image src={product?.image} alt={product?.name} style={styles.image} />
            </div>
          </Col>


            <Col md={3}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h3>{product?.name}</h3>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Rating
                    value={product?.rating}
                    text={`${product?.numReviews} reviews`}
                    color="#f8e825"
                  />
                </ListGroup.Item>

                <ListGroup.Item>Price: ${product?.price}</ListGroup.Item>

                <ListGroup.Item>Description: {product?.description}</ListGroup.Item>
              </ListGroup>
            </Col>

            <Col md={3}>
              <Card>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>${product?.price}</strong>
                      </Col>
                    </Row>
                    {/* AI Smart Pricing Badge - key forces fresh fetch per product */}
                    <div style={{ marginTop: '12px' }}>
                      <SmartPricingBadge
                        key={product?._id}
                        productId={product?._id}
                        currentPrice={product?.price}
                      />
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>{product?.countInStock > 0 ? 'In Stock' : 'Out of Stock'}</Col>
                    </Row>
                  </ListGroup.Item>

                  {product?.countInStock > 0 && (
                    <ListGroup.Item>
                      <Row>
                        <Col>Qty</Col>
                        <Col>
                          <Form.Control
                            as="select"
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                          >
                            {[...Array(product.countInStock).keys()].map((x) => (
                              <option key={x + 1} value={x + 1}>
                                {x + 1}
                              </option>
                            ))}
                          </Form.Control>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item>
                    <Button
                      onClick={addToCartHandler}
                      className="btn-block"
                      disabled={product?.countInStock === 0}
                      type="button"
                    >
                      Add To Cart
                    </Button>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <PriceAlertButton product={product} />
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={6}>
              <h4>Reviews</h4>

              {(product?.reviews?.length ?? 0) === 0 && <Message>No Reviews</Message>}

              <ListGroup variant="flush">
                {(product?.reviews ?? []).map((review) => (
                  <ListGroup.Item key={review._id}>
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} color="#f8e825" />
                    <p>{review.createdAt?.substring(0, 10)}</p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}

                <ListGroup.Item>
                  <h4>Write a Customer Review</h4>

                  {loadingProductReview && <Loader />}
                  {successProductReview && (
                    <Message variant="success">Review submitted successfully</Message>
                  )}
                  {errorProductReview && <Message variant="danger">{errorProductReview}</Message>}

                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group controlId="rating" className="my-2">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as="select"
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                        >
                          <option value={0}>Select...</option>
                          <option value={1}>1 - Poor</option>
                          <option value={2}>2 - Fair</option>
                          <option value={3}>3 - Good</option>
                          <option value={4}>4 - Very Good</option>
                          <option value={5}>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>

                      <Form.Group controlId="comment" className="my-2">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </Form.Group>

                      <Button
                        disabled={loadingProductReview}
                        type="submit"
                        variant="primary"
                        className="mt-2"
                      >
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message variant="info">
                      Please <Link to="/login">sign in</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>

          {relatedProducts && relatedProducts.length > 0 && (
            <Row className="mt-5">
              <Col>
                <div style={styles.frequentlyBoughtSection}>
                  <h3 style={styles.sectionTitle}>
                    🛒 Frequently Bought Together
                  </h3>
                  <p style={styles.sectionSubtitle}>
                    Customers who bought this item also bought
                  </p>

                  {loadingRelated ? (
                    <Loader />
                  ) : (
                    <Row>
                      {relatedProducts.slice(0, 4).map((item) => (
                        <Col key={item.product._id} sm={12} md={6} lg={3}>
                          <Product product={item.product} />
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  )
}

export default ProductScreen


const styles = {
  imageWrap: {
    width: '100%',
    maxHeight: 520,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.06)',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 520,
    objectFit: 'contain',
  },
  frequentlyBoughtSection: {
    marginTop: 40,
    marginBottom: 40,
    padding: '30px 0',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
}

