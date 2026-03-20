'use client'

import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-xl bg-slate-50 animate-pulse border border-slate-200" />
  ),
})

interface LocationPickerDynamicProps {
  latitude: number | null
  longitude: number | null
  radius: number
  onChange: (location: { latitude: number; longitude: number }) => void
}

export default function LocationPickerDynamic(props: LocationPickerDynamicProps) {
  return <LocationPicker {...props} />
}
