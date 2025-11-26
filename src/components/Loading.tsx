import { Loader } from 'lucide-react'
import './Loading.css'

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <Loader className="loading-spinner" />
        <h1>ARIA</h1>
        <p>Cargando...</p>
      </div>
    </div>
  )
}
