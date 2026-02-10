import React, { useEffect } from 'react'
import { Table, Button } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { listMyOrders } from '../actions/orderActions'

function OrdersScreen() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const orderListMy = useSelector((state) => state.orderListMy)
  const { loading: loadingOrders, error: errorOrders, orders } = orderListMy

  useEffect(() => {
    if (!userInfo) {
      navigate('/login')
    } else {
      dispatch(listMyOrders())
    }
  }, [dispatch, navigate, userInfo])

  return (
    <div>
      <h1>My Orders</h1>
      
      {loadingOrders ? (
        <Loader />
      ) : errorOrders ? (
        <Message variant="danger">{errorOrders}</Message>
      ) : !orders || orders.length === 0 ? (
        <Message variant="info">
          You haven't placed any orders yet.{' '}
          <LinkContainer to="/">
            <a href="/" style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              Start shopping
            </a>
          </LinkContainer>
        </Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>PAID</th>
              <th>DELIVERED</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const created = order?.createdAt ? order.createdAt.substring(0, 10) : '-'
              const paid = order?.paidAt ? order.paidAt.substring(0, 10) : null
              const delivered = order?.deliveredAt ? order.deliveredAt.substring(0, 10) : null

              return (
                <tr key={order?._id}>
                  <td>{order?._id}</td>
                  <td>{created}</td>
                  <td>${order?.totalPrice}</td>

                  <td>
                    {order?.isPaid && paid ? (
                      <span style={{ color: 'green' }}>
                        <i className="fas fa-check-circle"></i> {paid}
                      </span>
                    ) : (
                      <span style={{ color: 'red' }}>
                        <i className="fas fa-times"></i> Not Paid
                      </span>
                    )}
                  </td>

                  <td>
                    {order?.isDelivered && delivered ? (
                      <span style={{ color: 'green' }}>
                        <i className="fas fa-check-circle"></i> {delivered}
                      </span>
                    ) : (
                      <span style={{ color: 'orange' }}>
                        <i className="fas fa-clock"></i> Pending
                      </span>
                    )}
                  </td>

                  <td>
                    <LinkContainer to={`/order/${order?._id}`}>
                      <Button variant="primary" className="btn-sm">
                        View Details
                      </Button>
                    </LinkContainer>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </div>
  )
}

export default OrdersScreen
