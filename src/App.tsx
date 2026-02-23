import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EncounterPage, HomePage } from './pages';
import './App.css';

// Wrapper to get the ID from URL params
const EncounterPageWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <EncounterPage id={id} />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/e/:id" element={<EncounterPageWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;