import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Keywords from './pages/Keywords'
import Trending from './pages/Trending'
import Cbg from './pages/Cbg'
import Layout from './components/Layout'

function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/trending" replace />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/cbg" element={<Cbg />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
