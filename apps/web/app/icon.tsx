import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** App icon generated at build time — no binary assets to keep in the repo. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1, #4338ca)',
        color: 'white',
        fontSize: 300,
        fontWeight: 800,
      }}
    >
      U
    </div>,
    size,
  );
}
