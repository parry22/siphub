import { ImageResponse } from 'next/og'
import React from 'react'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: '#030303',
          color: '#00e5ff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          letterSpacing: '-2px',
          fontFamily: 'Bricolage Grotesque, Inter, sans-serif',
        }}
      >
        SIPs Hub
      </div>
    ),
    {
      ...size,
    }
  )
}
