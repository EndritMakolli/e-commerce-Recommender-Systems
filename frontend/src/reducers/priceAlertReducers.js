import {
  PRICE_ALERT_CREATE_REQUEST,
  PRICE_ALERT_CREATE_SUCCESS,
  PRICE_ALERT_CREATE_FAIL,
  PRICE_ALERT_CREATE_RESET,
  
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

export const priceAlertCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case PRICE_ALERT_CREATE_REQUEST:
      return { loading: true }
    case PRICE_ALERT_CREATE_SUCCESS:
      return { loading: false, success: true, alert: action.payload }
    case PRICE_ALERT_CREATE_FAIL:
      return { loading: false, error: action.payload }
    case PRICE_ALERT_CREATE_RESET:
      return {}
    default:
      return state
  }
}

export const priceAlertListReducer = (state = { alerts: [] }, action) => {
  switch (action.type) {
    case PRICE_ALERT_LIST_REQUEST:
      return { loading: true, alerts: [] }
    case PRICE_ALERT_LIST_SUCCESS:
      return { 
        loading: false, 
        alerts: action.payload.alerts,
        count: action.payload.count
      }
    case PRICE_ALERT_LIST_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}

export const priceAlertDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case PRICE_ALERT_DELETE_REQUEST:
      return { loading: true }
    case PRICE_ALERT_DELETE_SUCCESS:
      return { loading: false, success: true }
    case PRICE_ALERT_DELETE_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}

export const priceHistoryReducer = (state = { history: [], stats: {} }, action) => {
  switch (action.type) {
    case PRICE_HISTORY_REQUEST:
      return { loading: true, history: [], stats: {} }
    case PRICE_HISTORY_SUCCESS:
      return { 
        loading: false, 
        history: action.payload.history,
        stats: action.payload.stats,
        product: {
          id: action.payload.product_id,
          name: action.payload.product_name,
          current_price: action.payload.current_price
        }
      }
    case PRICE_HISTORY_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}

export const smartPricingReducer = (state = {}, action) => {
  switch (action.type) {
    case SMART_PRICING_REQUEST:
      return { ...state, loading: true }
    case SMART_PRICING_SUCCESS:
      return { ...state, loading: false, pricing: action.payload, error: null }
    case SMART_PRICING_FAIL:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}
