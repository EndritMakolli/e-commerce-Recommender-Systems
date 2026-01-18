import React from 'react'
import { Pagination, Form } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
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

  const onSelectPage = (e) => {
    const nextPage = Number(e.target.value) || 1
    const to = buildTo(nextPage)
    navigate(`${to.pathname}${to.search}`)
  }

  return (
    <div className="d-flex justify-content-center align-items-center gap-3 my-4 flex-wrap">
      <Pagination className="mb-0">
        {/* Prev */}
        <LinkContainer to={buildTo(Math.max(1, currentPage - 1))}>
          <Pagination.Prev disabled={currentPage === 1} />
        </LinkContainer>

        {/* Page numbers */}
        {[...Array(totalPages).keys()].map((x) => (
          <LinkContainer key={x + 1} to={buildTo(x + 1)}>
            <Pagination.Item active={x + 1 === currentPage}>{x + 1}</Pagination.Item>
          </LinkContainer>
        ))}

        {/* Next */}
        <LinkContainer to={buildTo(Math.min(totalPages, currentPage + 1))}>
          <Pagination.Next disabled={currentPage === totalPages} />
        </LinkContainer>
      </Pagination>

      {/* Page selector */}
      <div className="d-flex align-items-center gap-2">
        <span style={{ opacity: 0.8 }}>Page</span>
        <Form.Select
          value={currentPage}
          onChange={onSelectPage}
          style={{ width: 120 }}
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

export default Paginate
