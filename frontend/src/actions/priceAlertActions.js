import axios from 'axios'
import {
  PRICE_ALERT_CREATE_REQUEST,
  PRICE_ALERT_CREATE_SUCCESS,
  PRICE_ALERT_CREATE_FAIL,
  
  PRICE_ALERT_LIST_REQUEST,
  PRICE_ALERT_LIST_SUCCESS,
  PRICE_ALERT_LIST_FAIL,
  
  PRICE_ALERT_DELETE_REQUEST,
  PRICE_ALERT_DELETE_SUCCESS,
  PRICE_ALERT_DELETE_FAIL,
  
  PRICE_HISTORY_REQUEST,
  PRICE_HISTORY_SUCCESS,
  PRICE_HISTORY_FAIL,
  
  SMART_PRICING_REQUEST,
  SMART_PRICING_SUCCESS,
  SMART_PRICING_FAIL,
} from '../constants/priceAlertConstants'

export const createPriceAlert = (productId, targetPrice = null, notifyAnyDrop = false) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRICE_ALERT_CREATE_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      '/api/price-alerts/create/',
      {
        product_id: productId,
        target_price: targetPrice,
        notify_any_drop: notifyAnyDrop,
      },
      config
    )

    dispatch({
      type: PRICE_ALERT_CREATE_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: PRICE_ALERT_CREATE_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}

export const listMyPriceAlerts = () => async (dispatch, getState) => {
  try {
    dispatch({ type: PRICE_ALERT_LIST_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.get('/api/price-alerts/list/', config)

    dispatch({
      type: PRICE_ALERT_LIST_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: PRICE_ALERT_LIST_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}

export const deletePriceAlert = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRICE_ALERT_DELETE_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    await axios.delete(`/api/price-alerts/delete/${id}/`, config)

    dispatch({ type: PRICE_ALERT_DELETE_SUCCESS })
  } catch (error) {
    dispatch({
      type: PRICE_ALERT_DELETE_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}

export const getProductPriceHistory = (productId) => async (dispatch) => {
  try {
    dispatch({ type: PRICE_HISTORY_REQUEST })

    const { data } = await axios.get(`/api/price-alerts/history/${productId}/`)

    dispatch({
      type: PRICE_HISTORY_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: PRICE_HISTORY_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}

export const getSmartPricing = (productId) => async (dispatch, getState) => {
  try {
    dispatch({ type: SMART_PRICING_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.get(`/api/price-alerts/smart-pricing/${productId}/`, config)

    dispatch({
      type: SMART_PRICING_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: SMART_PRICING_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}
