// Visual Search Reducer
export const visualSearchReducer = (state = { results: [] }, action) => {
  switch (action.type) {
    case 'VISUAL_SEARCH_REQUEST':
      return { loading: true, results: [] }

    case 'VISUAL_SEARCH_SUCCESS':
      return {
        loading: false,
        results: action.payload.results || [],
        totalFound: action.payload.total_found,
      }

    case 'VISUAL_SEARCH_FAIL':
      return { loading: false, error: action.payload, results: [] }

    case 'VISUAL_SEARCH_RESET':
      return { results: [] }

    default:
      return state
  }
}
