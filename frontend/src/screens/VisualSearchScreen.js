import React, { useState, useRef } from 'react'
import { Row, Col, Container, Card, Button, Alert } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { visualSearch, clearVisualSearch } from '../actions/aiActions'
import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'

function VisualSearchScreen() {
  const dispatch = useDispatch()
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const visualSearchState = useSelector((state) => state.visualSearch)
  const { loading, error, results, totalFound } = visualSearchState

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please select a valid image file')
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleSearch = () => {
    if (selectedImage) {
      dispatch(visualSearch(selectedImage, 8))
    }
  }

  const handleClear = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    dispatch(clearVisualSearch())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2 style={styles.pageTitle}>🖼️ Visual Search</h2>
          <p style={styles.pageSubtitle}>
            Upload an image to find visually similar products
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card style={styles.uploadCard}>
            <Card.Body>
              {!previewUrl ? (
                <div
                  style={{
                    ...styles.dropZone,
                    ...(isDragging ? styles.dropZoneDragging : {}),
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={styles.dropZoneContent}>
                    <div style={styles.uploadIcon}>📸</div>
                    <h4 style={styles.dropZoneTitle}>
                      Drag & Drop Image Here
                    </h4>
                    <p style={styles.dropZoneText}>or click to browse</p>
                    <p style={styles.dropZoneHint}>
                      Supported formats: JPG, PNG, WEBP
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept="image/*"
                    style={styles.hiddenInput}
                  />
                </div>
              ) : (
                <div style={styles.previewContainer}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                  <div style={styles.previewActions}>
                    <Button
                      variant="primary"
                      onClick={handleSearch}
                      disabled={loading}
                      style={styles.searchButton}
                    >
                      {loading ? 'Searching...' : '🔍 Find Similar Products'}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleClear}
                      style={styles.clearButton}
                    >
                      🗑️ Clear
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading && (
        <Row>
          <Col className="text-center">
            <Loader />
            <p style={styles.loadingText}>Analyzing image with AI...</p>
          </Col>
        </Row>
      )}

      {error && (
        <Row>
          <Col>
            <Message variant="danger">{error}</Message>
          </Col>
        </Row>
      )}

      {results && results.length > 0 && (
        <>
          <Row className="mb-3">
            <Col>
              <Alert variant="success" style={styles.resultsAlert}>
                <strong>✨ Found {totalFound} similar products!</strong>
                <span style={styles.aiPowered}> Powered by AI</span>
              </Alert>
            </Col>
          </Row>

          <Row>
            {results.map((item) => (
              <Col key={item.product._id} sm={12} md={6} lg={3} className="mb-4">
                <div style={styles.productCard}>
                  <Product product={item.product} />
                  <div style={styles.similarityBadge}>
                    <span style={styles.similarityIcon}>🎯</span>
                    <span style={styles.similarityText}>
                      {item.match_percentage}% match
                    </span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}

      {results && results.length === 0 && !loading && !error && previewUrl && (
        <Row>
          <Col>
            <Message variant="info">
              No similar products found. Try a different image or ensure product embeddings are generated.
            </Message>
          </Col>
        </Row>
      )}
    </Container>
  )
}

const styles = {
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: '#333',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 0,
  },
  uploadCard: {
    borderRadius: 10,
    border: '2px dashed rgba(0,0,0,0.2)',
    boxShadow: 'none',
  },
  dropZone: {
    padding: '60px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: 8,
  },
  dropZoneDragging: {
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    borderColor: '#007bff',
  },
  dropZoneContent: {
    pointerEvents: 'none',
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  dropZoneTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
    marginBottom: 8,
  },
  dropZoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dropZoneHint: {
    fontSize: 12,
    color: '#999',
  },
  hiddenInput: {
    display: 'none',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 400,
    borderRadius: 8,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  previewActions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  searchButton: {
    padding: '10px 24px',
    fontSize: 16,
    fontWeight: 600,
  },
  clearButton: {
    padding: '10px 24px',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  resultsAlert: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
    borderRadius: 8,
  },
  aiPowered: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  productCard: {
    position: 'relative',
  },
  similarityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  similarityIcon: {
    fontSize: 14,
  },
  similarityText: {
    fontSize: 13,
  },
}

export default VisualSearchScreen
