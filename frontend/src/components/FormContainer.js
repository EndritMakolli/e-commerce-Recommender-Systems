import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

function FormContainer({ children }) {
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          {children}
        </Col>
      </Row>
    </Container>
  )
}

export default FormContainer
