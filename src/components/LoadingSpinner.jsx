import React from 'react'
import { RefreshCw } from 'lucide-react'

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center gap-4">
        <RefreshCw className="w-6 h-6 text-primary-600 loading-spinner" />
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  )
}

export default LoadingSpinner