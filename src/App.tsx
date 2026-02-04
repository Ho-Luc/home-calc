import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import RefinancePage from './components/RefinancePage';

function Header() {
  const location = useLocation();

  return (
    <header className="header" data-testid="header">
      <div className="header-content">
        <h1 data-testid="site-title">Mortgage Calculator</h1>
        <nav className="nav" data-testid="navigation">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
            data-testid="home-link"
          >
            Calculator
          </Link>
          <Link 
            to="/refinance" 
            className={location.pathname === '/refinance' ? 'active' : ''}
            data-testid="refinance-link"
          >
            Refinance & Paydown
          </Link>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/refinance" element={<RefinancePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;