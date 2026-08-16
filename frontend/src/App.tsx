import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'
import Keywords from './pages/Keywords'
import Trending from './pages/Trending'
import Notifications from './pages/Notifications'
import SkillsCenter from './pages/SkillsCenter'
import Layout from './components/Layout'

function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/skills" element={<SkillsCenter />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
