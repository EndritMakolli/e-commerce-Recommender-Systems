// src/components/SearchBox.js
import React, { useState } from 'react'
import { Form, FormControl, InputGroup, Button } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'

function SearchBox({ style = {} }) {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const submitHandler = (e) => {
    e.preventDefault()
    const q = keyword.trim()

    if (q) {
      // ✅ Same functionality (query param)
      navigate(`/?keyword=${encodeURIComponent(q)}`)
    } else {
      // ✅ Same idea: go to current pathname (clears search)
      navigate(location.pathname)
    }
  }

  return (
    <Form onSubmit={submitHandler} style={{ ...s.searchForm, ...style }}>
      <InputGroup style={s.searchGroup}>
        <FormControl
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search products..."
          aria-label="Search"
          style={s.searchInput}
        />
        <Button type="submit" style={s.searchBtn}>
          Search
        </Button>
      </InputGroup>
    </Form>
  )
}

const s = {
  searchForm: {
    width: 360,
    maxWidth: '52vw',
  },
  searchGroup: {
    borderRadius: 999,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.9)',
    padding: '11px 14px',
    boxShadow: 'none',
  },
  searchBtn: {
    border: 'none',
    background: 'rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.92)',
    padding: '11px 16px',
    borderLeft: '1px solid rgba(255,255,255,0.12)',
  },
}

export default SearchBox
