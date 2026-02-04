import React from 'react'
import { Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

function Paginate({ pages, page, keyword = '', isAdmin = false }) {
  const navigate = useNavigate()

  const totalPages = Number(pages)
  const currentPage = Number(page) || 1

  if (!Number.isFinite(totalPages) || totalPages <= 1) return null

  const buildTo = (pageNumber) => {
    const qs = new URLSearchParams()
    if (keyword) qs.set('keyword', keyword)
    qs.set('page', String(pageNumber))

    return {
      pathname: isAdmin ? '/admin/productlist' : '/',
      search: `?${qs.toString()}`,
    }
  }

  const goToPage = (pageNumber) => {
    const to = buildTo(pageNumber)
    navigate(`${to.pathname}${to.search}`)
  }

  const onSelectPage = (e) => {
    const nextPage = Number(e.target.value) || 1
    goToPage(nextPage)
  }

  return (
    <div style={styles.container}>
      {/* Arrow button - Previous */}
      <button
        onClick={() => goToPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{
          ...styles.arrowButton,
          ...(currentPage === 1 ? styles.arrowDisabled : {}),
        }}
      >
        &lt;
      </button>

      {/* Page numbers */}
      <div style={styles.pageNumbers}>
        {[...Array(totalPages).keys()].map((x) => {
          const pageNum = x + 1
          const isActive = pageNum === currentPage
          return (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              style={{
                ...styles.pageButton,
                ...(isActive ? styles.pageActive : {}),
              }}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      {/* Arrow button - Next */}
      <button
        onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{
          ...styles.arrowButton,
          ...(currentPage === totalPages ? styles.arrowDisabled : {}),
        }}
      >
        &gt;
      </button>

      {/* Page selector dropdown */}
      <div style={styles.selectorContainer}>
        <span style={styles.selectorLabel}>Page</span>
        <Form.Select
          value={currentPage}
          onChange={onSelectPage}
          style={styles.selector}
          aria-label="Select page"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {p} / {totalPages}
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    margin: '32px 0',
    flexWrap: 'wrap',
  },
  arrowButton: {
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: 6,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    color: '#000',
    transition: 'all 0.2s',
  },
  arrowDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  pageNumbers: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  pageButton: {
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: 6,
    minWidth: 36,
    height: 36,
    padding: '0 10px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#000',
    transition: 'all 0.2s',
  },
  pageActive: {
    background: '#000',
    color: 'white',
    borderColor: '#000',
  },
  selectorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  selectorLabel: {
    opacity: 0.7,
    fontSize: 14,
    color: '#000',
  },
  selector: {
    width: 110,
    fontSize: 14,
    background: 'white',
    border: '1px solid #ccc',
    color: '#000',
  },
}

export default Paginate
