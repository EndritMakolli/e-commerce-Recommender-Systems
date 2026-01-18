import React, { useEffect, useMemo, useRef } from 'react'
import { Button } from 'react-bootstrap'
import Product from './Product'

function RecommendedSlider({ items = [], title = 'Recommended for you' }) {
  const scrollerRef = useRef(null)
  const autoScrollRef = useRef(null)

  const products = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .map((x) => (x && x.product ? x.product : x))
      .filter(Boolean)
  }, [items])

  const getStep = (el) => {
    const card = el?.querySelector('[data-card="1"]')
    return card ? card.getBoundingClientRect().width + 12 : 260
  }

  const scrollByCards = (dir = 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * getStep(el), behavior: 'smooth' })
  }

  const autoScrollTick = () => {
    const el = scrollerRef.current
    if (!el) return

    const step = getStep(el)
    const maxLeft = el.scrollWidth - el.clientWidth
    const nextLeft = el.scrollLeft + step

    if (nextLeft >= maxLeft - 5) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: step, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (!products.length) return

    autoScrollRef.current = setInterval(autoScrollTick, 4000)

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length])

  const pauseAuto = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    autoScrollRef.current = null
  }

  const resumeAuto = () => {
    if (!autoScrollRef.current) autoScrollRef.current = setInterval(autoScrollTick, 4000)
  }

  if (!products.length) return null

  return (
    <section style={s.section}>
      <div style={s.bgGlow} />

      <div style={s.card}>
        <div style={s.header}>
          <div>
            <div style={s.kicker}>Personalized picks</div>
            <h5 style={s.title}>{title}</h5>
          </div>

          <div style={s.actions}>
            <Button
              variant="light"
              size="sm"
              onClick={() => scrollByCards(-1)}
              style={s.arrowBtn}
              aria-label="Previous"
            >
              ‹
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={() => scrollByCards(1)}
              style={s.arrowBtn}
              aria-label="Next"
            >
              ›
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          style={s.scroller}
          className="hide-scrollbar"
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
        >
          {products.map((p) => (
            <div key={p._id} style={s.item} data-card="1">
              <Product product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const s = {
  section: {
    position: 'relative',
    marginBottom: 16, // smaller
    paddingTop: 0, // smaller
  },
  bgGlow: {
    position: 'absolute',
    inset: '-10px -10px auto -10px',
    height: 120, // smaller
    background:
      'radial-gradient(600px 180px at 30% 40%, rgba(0, 200, 255, 0.18), rgba(0,0,0,0)),' +
      'radial-gradient(600px 180px at 70% 60%, rgba(140, 90, 255, 0.16), rgba(0,0,0,0))',
    filter: 'blur(8px)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    borderRadius: 18,
    padding: '10px 10px 8px 10px', // smaller
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 14px 40px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    padding: '2px 4px 6px 4px', // smaller
  },
  kicker: {
    fontSize: 11, // smaller
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.65,
    marginBottom: 2,
  },
  title: {
    margin: 0,
    fontWeight: 900,
    letterSpacing: 0.6,
    fontSize: 16, // slightly smaller
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  arrowBtn: {
    width: 34, // smaller
    height: 34, // smaller
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18, // smaller
    padding: 0,
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
  },
  scroller: {
    display: 'flex',
    gap: 12, // smaller
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '4px 4px 6px 4px', // smaller
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
  },
  item: {
    flex: '0 0 auto',
    width: 230, // smaller (often reduces card height too)
    scrollSnapAlign: 'start',
    transform: 'translateZ(0)',
  },
}

export default RecommendedSlider
