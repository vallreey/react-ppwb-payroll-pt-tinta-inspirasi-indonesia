import { ICON_PATHS } from '../utils/iconPaths'

const linePaths = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  arrow: <path d="M7 17 17 7M7 7h10v10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
}

const svgProps = {
  'aria-hidden': 'true',
  focusable: 'false',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export default function Icon({ name, size = 18, className }) {
  const line = linePaths[name]
  if (line) {
    return (
      <svg {...svgProps} width={size} height={size} strokeWidth="1.8" className={className}>
        {line}
      </svg>
    )
  }
  return (
    <svg
      {...svgProps}
      strokeWidth="1.75"
      className={`${className ?? 'size-5'} shrink-0`}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? '' }}
    />
  )
}
