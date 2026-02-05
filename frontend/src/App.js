import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'

import Header from './components/Header'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import { RiChatAiLine } from "react-icons/ri";

import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen'
import CartScreen from './screens/CartScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import ShippingScreen from './screens/ShippingScreen'
import PaymentScreen from './screens/PaymentScreen'
import PlaceOrderScreen from './screens/PlaceOrderScreen'
import OrderScreen from './screens/OrderScreen'
import UserEditScreen from './screens/UserEditScreen'
import UserListScreen from './screens/UserListScreen'
import ProductListScreen from './screens/ProductListScreen'
import ProductEditScreen from './screens/ProductEditScreen'
import OrderListScreen from './screens/OrderListScreen'
import OutOfStockScreen from './screens/OutOfStockScreen'
import VisualSearchScreen from './screens/VisualSearchScreen'

function App() {
  const [showChat, setShowChat] = useState(false)
  const [clearTrigger, setClearTrigger] = useState(0)
  
  // Check if mobile
  const isMobile = window.innerWidth <= 480

  // Clear chat when opening
  const handleOpenChat = () => {
    setClearTrigger(prev => prev + 1)
    setShowChat(true)
  }

  // Clear chat when closing
  const handleCloseChat = () => {
    setClearTrigger(prev => prev + 1)
    setShowChat(false)
  }

  return (
    <Router>
      <Header />

      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/product/:id" element={<ProductScreen />} />
            <Route path="/cart/:id?" element={<CartScreen />} />

            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />

            <Route path="/shipping" element={<ShippingScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />

            <Route path="/order/:id" element={<OrderScreen />} />
            <Route path="/admin/userlist" element={<UserListScreen />} />
            <Route path="/admin/user/:id/edit" element={<UserEditScreen />} />
            <Route path="/admin/productlist" element={<ProductListScreen />} />
            <Route path="/admin/product/:id/edit" element={<ProductEditScreen />} />
            <Route path="/admin/orderlist" element={<OrderListScreen />} />
            <Route path="/outofstock" element={<OutOfStockScreen />} />
            <Route path="/visual-search" element={<VisualSearchScreen />} />
          </Routes>
        </Container>
      </main>

      <Footer />

      {/* Modern ChatBot Widget - Responsive */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '90px',
          right: isMobile ? '10px' : '20px',
          left: isMobile ? '10px' : 'auto',
          zIndex: 999,
          width: isMobile ? 'calc(100% - 20px)' : '360px',
          maxWidth: isMobile ? '400px' : '360px',
          height: isMobile ? 'calc(100vh - 100px)' : '520px',
          maxHeight: isMobile ? 'calc(100vh - 100px)' : '80vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'white',
          animation: 'slideUp 0.3s ease'
        }}>
          <ChatBot clearTrigger={clearTrigger} />
          {/* Close button inside chat widget */}
          <button
            onClick={handleCloseChat}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 1000,
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Toggle Button - Only shows when chat is closed */}
      {!showChat && (
        <button
          onClick={handleOpenChat}
          style={{
            position: 'fixed',
            bottom: isMobile ? '15px' : '20px',
            right: isMobile ? '15px' : '20px',
            width: isMobile ? '50px' : '56px',
            height: isMobile ? '50px' : '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: isMobile ? '24px' : '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
          }}
          onMouseOver={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseOut={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
            }
          }}
          title="Chat with AI"
        >
   <RiChatAiLine />
        </button>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Router>
  )
}

export default App
