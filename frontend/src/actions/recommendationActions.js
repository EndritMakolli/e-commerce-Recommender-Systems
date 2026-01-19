import axios from 'axios'

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

// "For you" recommendations (home / cart)
export const listMyRecommendations = (topn = 8) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECOMMENDATIONS_MY_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }

    const { data } = await axios.get(
      `/api/recommendations/my/?topn=${topn}&_=${Date.now()}`,
      config
    )

    dispatch({ type: RECOMMENDATIONS_MY_SUCCESS, payload: data })
  } catch (error) {
    dispatch({
      type: RECOMMENDATIONS_MY_FAIL,
      payload: error.response?.data?.detail || error.message,
    })
  }
}

export const resetMyRecommendations = () => (dispatch) => {
  dispatch({ type: RECOMMENDATIONS_MY_RESET })
}

// Related products recommendations (product page)
export const listRelatedRecommendations = (productId) => async (dispatch) => {
  try {
    dispatch({ type: RECOMMENDATIONS_RELATED_REQUEST })

    const { data } = await axios.get(`/api/recommendations/related/${productId}/`)

    dispatch({ type: RECOMMENDATIONS_RELATED_SUCCESS, payload: data })
  } catch (error) {
    dispatch({
      type: RECOMMENDATIONS_RELATED_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    })
  }
}

export const resetRelatedRecommendations = () => (dispatch) => {
  dispatch({ type: RECOMMENDATIONS_RELATED_RESET })
}

// Restock recommendations (OutOfStock screen) - STATIC (saved in DB)
export const listRestockRecommendations = () => async (dispatch, getState) => {
  try {
    dispatch({ type: RECOMMENDATIONS_MY_REQUEST }) // reuse same reducer for simplicity

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }

    // This hits getRecommendations (DB stored) using rec_type=restock
    const { data } = await axios.get(
      `/api/recommendations/?type=restock&_=${Date.now()}`,
      config
    )

    dispatch({ type: RECOMMENDATIONS_MY_SUCCESS, payload: data })
  } catch (error) {
    dispatch({
      type: RECOMMENDATIONS_MY_FAIL,
      payload: error.response?.data?.detail || error.message,
    })
  }
}

// ✅ Restock recommendations - DYNAMIC (computed live from orders)
export const listRestockDynamic = (topn = 8) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECOMMENDATIONS_MY_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }

    const { data } = await axios.get(
      `/api/recommendations/restock-dynamic/?topn=${topn}&_=${Date.now()}`,
      config
    )

    dispatch({ type: RECOMMENDATIONS_MY_SUCCESS, payload: data })
  } catch (error) {
    dispatch({
      type: RECOMMENDATIONS_MY_FAIL,
      payload: error.response?.data?.detail || error.message,
    })
  }
}
