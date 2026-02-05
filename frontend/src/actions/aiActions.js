import axios from 'axios'

// Visual Search Actions
export const visualSearch = (imageFile, topK = 8) => async (dispatch) => {
  try {
    dispatch({ type: 'VISUAL_SEARCH_REQUEST' })

    const formData = new FormData()
    formData.append('image', imageFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    const { data } = await axios.post(
      `/api/ai/visual-search/?top_k=${topK}`,
      formData,
      config
    )

    dispatch({
      type: 'VISUAL_SEARCH_SUCCESS',
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: 'VISUAL_SEARCH_FAIL',
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    })
  }
}

export const clearVisualSearch = () => (dispatch) => {
  dispatch({ type: 'VISUAL_SEARCH_RESET' })
}
