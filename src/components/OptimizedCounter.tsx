import { useState } from 'react'

// This component will benefit from React Compiler optimizations
// React Compiler should automatically memoize expensive computations based on dependencies
function OptimizedCounter() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  // This expensive computation should be automatically memoized by React Compiler
  // and should only run when 'count' changes, not when 'name' changes
  const expensiveComputation = (value: number) => {
    console.log('Running expensive computation for count:', value)
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += i * value
    }
    return result
  }

  // React Compiler should detect that this only depends on 'count'
  const computedValue = expensiveComputation(count)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">React Compiler Test</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Counter:</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(count - 1)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold">{count}</span>
            <button
              onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-500/10 rounded-lg">
          <p className="text-sm">
            Hello {name || 'Anonymous'}! Computed value: {computedValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Check the console - React Compiler should prevent unnecessary recalculations
            when only the name changes (not the counter).
          </p>
        </div>
      </div>
    </div>
  )
}

export default OptimizedCounter