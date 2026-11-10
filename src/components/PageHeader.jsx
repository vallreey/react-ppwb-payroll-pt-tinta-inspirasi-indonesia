import { useEffect } from 'react'
import { useLayoutHeader } from '../context/LayoutContext'

export default function PageHeader({ title, subtitle, actions }) {
  const setHeader = useLayoutHeader()

  useEffect(() => {
    setHeader({ title, subtitle })
  }, [setHeader, title, subtitle])

  if (!actions) return null
  return <div className="no-print mb-5 flex flex-wrap items-center justify-end gap-3">{actions}</div>
}
