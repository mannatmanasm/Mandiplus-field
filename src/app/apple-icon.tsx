import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background:
            'linear-gradient(135deg, #fff3d6 0%, #f8fafc 45%, #ddd6fe 100%)',
          color: '#111827',
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '-0.06em',
        }}
      >
        <span style={{ color: '#111827' }}>Mandi</span>
        <span style={{ color: '#7c2ae8' }}>Plus</span>
      </div>
    ),
    size,
  );
}
