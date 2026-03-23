'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AddressSearch from '@/components/AddressSearch'

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  radius: number
  onChange: (location: { latitude: number; longitude: number }) => void
}

export default function LocationPicker({ latitude, longitude, radius, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstance.current) return

    const center: L.LatLngExpression = latitude != null && longitude != null
      ? [latitude, longitude]
      : [39.8283, -98.5795] // Center of US as default

    const zoom = latitude != null ? 16 : 4

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView(center, zoom)

    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // If initial position is set, add marker and circle
    if (latitude != null && longitude != null) {
      const icon = L.divIcon({
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      })

      markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map)
      circleRef.current = L.circle([latitude, longitude], {
        radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.5,
      }).addTo(map)
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      onChange({ latitude: lat, longitude: lng })
    })

    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker and circle when position/radius changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (latitude != null && longitude != null) {
      const latlng: L.LatLngExpression = [latitude, longitude]

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng)
      } else {
        const icon = L.divIcon({
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        })
        markerRef.current = L.marker(latlng, { icon }).addTo(map)
      }

      if (circleRef.current) {
        circleRef.current.setLatLng(latlng)
        circleRef.current.setRadius(radius)
      } else {
        circleRef.current = L.circle(latlng, {
          radius,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.5,
        }).addTo(map)
      }

      map.setView(latlng, Math.max(map.getZoom(), 15))
    }
  }, [latitude, longitude, radius])

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      },
      (err) => {
        alert(`Unable to get location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="space-y-2">
      <AddressSearch
        placeholder="Search by address..."
        onSelect={(result) => {
          onChange({ latitude: result.latitude, longitude: result.longitude })
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
          Use My Location
        </button>
        {latitude != null && longitude != null && (
          <span className="text-xs text-slate-500 font-mono">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>
      <div
        ref={mapRef}
        className="w-full h-[250px] rounded-xl overflow-hidden border border-slate-200"
      />
      <p className="text-xs text-slate-400">Search an address, use your location, or click the map.</p>
    </div>
  )
}
