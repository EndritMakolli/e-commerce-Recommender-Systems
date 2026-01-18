import React from 'react'
import { Card } from 'react-bootstrap'
import Rating from './Rating'
import { Link } from 'react-router-dom'

function Product({ product }) {
  if (!product) return null

  return (
    <Card className="my-3 py-3 rounded">
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
        {/* ✅ fixed image area so different aspect ratios don't change card height */}
        <div style={styles.imageWrap}>
          <Card.Img src={product.image} alt={product.name} style={styles.image} />
        </div>
      </Link>

      <Card.Body>
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          {/* ✅ clamp name to 2 lines so long titles don't increase height */}
          <Card.Title as="div" style={styles.title}>
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        <Card.Text as="div">
          <Rating value={product.rating} text={`${product.numReviews} reviews`} color="#f8e825" />
        </Card.Text>

        <Card.Text as="h3">${product.price}</Card.Text>
      </Card.Body>
    </Card>
  )
}

const styles = {
  imageWrap: {
    width: '100%',
    aspectRatio: '1 / 1', // ✅ square area
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // ✅ prevents laptop image from stretching the card
  },
  title: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: 44, // ✅ keeps all titles same height
  },
}

export default Product
