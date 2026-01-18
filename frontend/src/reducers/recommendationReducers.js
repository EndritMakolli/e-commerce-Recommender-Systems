import {
  RECOMMENDATIONS_MY_REQUEST,
  RECOMMENDATIONS_MY_SUCCESS,
  RECOMMENDATIONS_MY_FAIL,
  RECOMMENDATIONS_MY_RESET,
  RECOMMENDATIONS_RELATED_REQUEST,
  RECOMMENDATIONS_RELATED_SUCCESS,
  RECOMMENDATIONS_RELATED_FAIL,
  RECOMMENDATIONS_RELATED_RESET,
} from '../constants/recommendationConstants'

// For cart / user based recs (e.g., "Recommended for you")
export const myRecommendationsReducer = (state = { items: [] }, action) => {
  switch (action.type) {
    case RECOMMENDATIONS_MY_REQUEST:
      return { ...state, loading: true, error: null }

    case RECOMMENDATIONS_MY_SUCCESS:
      return { loading: false, items: action.payload, error: null }

    case RECOMMENDATIONS_MY_FAIL:
      return { loading: false, items: [], error: action.payload }

    case RECOMMENDATIONS_MY_RESET:
      return { items: [] }

    default:
      return state
  }
}

// For product-related recs (e.g., "Related to this product")
export const relatedRecommendationsReducer = (state = { items: [] }, action) => {
  switch (action.type) {
    case RECOMMENDATIONS_RELATED_REQUEST:
      return { ...state, loading: true, error: null }

    case RECOMMENDATIONS_RELATED_SUCCESS:
      return { loading: false, items: action.payload, error: null }

    case RECOMMENDATIONS_RELATED_FAIL:
      return { loading: false, items: [], error: action.payload }

    case RECOMMENDATIONS_RELATED_RESET:
      return { items: [] }

    default:
      return state
  }
}
