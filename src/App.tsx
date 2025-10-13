import React from 'react'

function App() {
  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* Left Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Flow Connector</h2>
          <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
            Select 2 frames with Shift+Click to create a connection
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Preview
            </h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 h-64 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Preview will appear here</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App