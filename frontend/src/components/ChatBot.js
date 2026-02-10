import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBot.css';
import { AiOutlineDelete } from "react-icons/ai";
import { AiOutlineRobot } from "react-icons/ai";

const ChatBot = ({ userInfo, clearTrigger }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef(null);

  const API_BASE = 'http://localhost:8000/api/chatbot';

  // Suggested questions for users to click
  const suggestedQuestions = [

       "How do I create an account?",
 "How can I track my order?",
    "What's popular right now?",
       "What payment methods do you accept?",     
    "Can you recommend products for me?",
    "What is your return policy?",
                    
  ];

  // Get token from localStorage
  const getToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    try {
      return JSON.parse(userInfo).token;
    } catch (e) {
      return null;
    }
  };

  // Get axios config with auth
  const getAxiosConfig = () => {
    const token = getToken();
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
  };

  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      fetchSessions();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sessions/`, getAxiosConfig());
      setSessions(response.data);
      
      if (response.data.length > 0 && !currentSession) {
        setCurrentSession(response.data[0]);
      } else if (response.data.length === 0) {
        // Auto-create first session if none exists
        await createNewSession();
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Fetch messages for current session
  const fetchMessages = async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/sessions/${sessionId}/messages/`,
        getAxiosConfig()
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch messages when session changes
  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
  }, [currentSession]);

  // Clear chat when clearTrigger changes
  useEffect(() => {
    if (clearTrigger > 0 && currentSession) {
      // Clear messages immediately
      setMessages([]);
      // Then clear from backend
      clearSession();
    }
  }, [clearTrigger]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new session
  const createNewSession = async () => {
    try {
      const title = newSessionTitle || `Chat ${new Date().toLocaleDateString()}`;

      const response = await axios.post(
        `${API_BASE}/sessions/`,
        { title },
        getAxiosConfig()
      );

      setSessions([response.data, ...sessions]);
      setCurrentSession(response.data);
      setMessages([]);
      setNewSessionTitle('');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create chat session. Make sure you are logged in.');
    }
  };

  // Send message and get response (sessionToUse = currentSession, or new session when auto-creating)
  const sendMessage = async (e, questionText = null, sessionToUse = null) => {
    if (e && e.preventDefault) e.preventDefault();

    const messageText = questionText || inputValue.trim();
    if (!messageText) return;

    let session = sessionToUse || currentSession;

    // If no session yet, create one first then send with the new session
    if (!session) {
      setIsLoading(true);
      try {
        const title = `Chat ${new Date().toLocaleDateString()}`;
        const response = await axios.post(
          `${API_BASE}/sessions/`,
          { title },
          getAxiosConfig()
        );
        const newSession = response.data;
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
        session = newSession;
      } catch (err) {
        console.error('Error creating session:', err);
        alert('Could not start chat. Make sure you are logged in and the chatbot API is running.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    setInputValue('');

    try {
      // Add user message to UI immediately
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          content: messageText,
          timestamp: new Date().toISOString(),
          related_products: [],
        },
      ]);

      // Send to backend
      const response = await axios.post(
        `${API_BASE}/sessions/${session.id}/send_message/`,
        { content: messageText },
        getAxiosConfig()
      );

      // Add bot response
      if (response.data.bot_message) {
        setMessages((prev) => [
          ...prev,
          {
            id: response.data.bot_message.id,
            sender: 'bot',
            content: response.data.bot_message.content,
            timestamp: response.data.bot_message.timestamp,
            related_products: response.data.bot_message.related_products || [],
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          content: 'Sorry, I encountered an error. Please check your backend is running and your API key is configured.',
          timestamp: new Date().toISOString(),
          related_products: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark message as helpful
  const markHelpful = async (messageId, isHelpful) => {
    try {
      await axios.post(
        `${API_BASE}/sessions/${currentSession.id}/mark_helpful/`,
        { message_id: messageId, is_helpful: isHelpful },
        getAxiosConfig()
      );
    } catch (error) {
      console.error('Error marking message:', error);
    }
  };

  // Clear session
  const clearSession = async () => {
    try {
      await axios.delete(
        `${API_BASE}/sessions/${currentSession.id}/clear_session/`,
        getAxiosConfig()
      );
      setMessages([]);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="chatbot-container">
        <div className="login-prompt">
          <h3>Login Required</h3>
          <p>Please login to start chatting with our AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      {/* Chat Header */}
      <div className="chat-header">
        <h2>AI Assistant</h2>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h5>How can I help you today?</h5>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.id || message.timestamp || 'message'}-${index}`}
              className={`message ${message.sender}-message`}
            >
              <div className="message-content">
                {message.content}
              </div>

              {message.sender === 'bot' && (
                <div className="message-actions">
                </div>
              )}

              {message.related_products &&
                message.related_products.length > 0 && (
                  <div className="related-products">
                    <h4>Related Products</h4>
                    <div className="products-grid">
                      {message.related_products.map((product, productIndex) => (
                        <div
                          key={`${product.id || product.slug || product.name || 'product'}-${productIndex}`}
                          className="product-card-mini"
                        >
                          <img
                            src={
                              product.image ||
                              '/images/placeholder.png'
                            }
                            alt={product.name}
                          />
                          <p>{product.name}</p>
                          <p className="price">${product.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message bot-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Buttons - Always visible */}
      <div className="quick-actions-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <p className="quick-actions-label" style={{ margin: 0 }}>Choose a question:</p>
          {currentSession && (
            <button onClick={clearSession} className="clear-btn-bottom" title="Clear conversation">
           <AiOutlineDelete />
            </button>
          )}
        </div>
        <div className="quick-actions-grid">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={(e) => sendMessage(e, question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
