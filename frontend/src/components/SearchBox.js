// src/components/SearchBox.js
import React, { useState } from 'react'
import { Form, FormControl, InputGroup, Button } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'

function SearchBox({ style = {} }) {
  const [keyword, setKeyword] = useState('')
  const [semantic, setSemantic] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const submitHandler = (e) => {
    e.preventDefault()
    const q = keyword.trim()

    if (q) {
      const params = new URLSearchParams()
      params.set('keyword', q)
      if (semantic) {
        params.set('semantic', '1')
      }
      navigate(`/?${params.toString()}`)
    } else {
      navigate(location.pathname)
    }
  }

  return (
    <Form onSubmit={submitHandler} style={{ ...s.searchForm, ...style }}>
      <div style={s.searchContainer}>
        <InputGroup style={s.searchGroup}>
          <FormControl
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={semantic ? "🔮 AI-powered search..." : "Search products..."}
            aria-label="Search"
            style={s.searchInput}
          />
          <Button type="submit" style={s.searchBtn}>
            Search
          </Button>
        </InputGroup>
        
        <div style={s.switchContainer}>
          <Form.Check
            type="switch"
            id="semantic-toggle"
            checked={semantic}
            onChange={(e) => setSemantic(e.target.checked)}
            style={s.switch}
            label=""
          />
          <span style={{
            ...s.switchLabel,
            opacity: semantic ? 1 : 0.5,
          }}>
            🤖 AI
          </span>
        </div>
      </div>
    </Form>
  )
}

const s = {
  searchForm: {
    width: '100%',
    maxWidth: 600,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  searchGroup: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
    height: 38,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.9)',
    padding: '8px 14px',
    boxShadow: 'none',
    fontSize: 14,
    height: '100%',
  },
  searchBtn: {
    border: 'none',
    background: 'rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.92)',
    padding: '8px 16px',
    borderLeft: '1px solid rgba(255,255,255,0.12)',
    fontSize: 14,
    height: '100%',
    whiteSpace: 'nowrap',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: '6px 12px',
    height: 38,
    whiteSpace: 'nowrap',
  },
  switch: {
    margin: 0,
    paddingLeft: '20px',
    paddingTop: 0,
    cursor: 'pointer',
  },
  switchLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: 500,
    userSelect: 'none',
    margin: 0,
    lineHeight: 1,
  },
}

export default SearchBox
