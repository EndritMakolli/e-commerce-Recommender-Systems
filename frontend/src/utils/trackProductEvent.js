import axios from 'axios'

/**
 * Track product events for AI analysis
 * @param {string} productId - Product ID
 * @param {string} eventType - 'view' | 'add_to_cart' | 'purchase'
 * @param {string} token - User auth token
 */
export const trackProductEvent = async (productId, eventType, token) => {
  if (!token || !productId) {
    return // Don't track if user not logged in or no product ID
  }

  try {
    await axios.post(
      `/api/products/${productId}/track/`,
      { event_type: eventType },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
    // Silently track - no need to show errors to user
  } catch (error) {
    // Silently fail - tracking shouldn't break user experience
    console.debug('Product event tracking failed:', error)
  }
}
