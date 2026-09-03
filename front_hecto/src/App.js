import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Glowna from './pages/Glowna';
import Header from './components/Header';
import Platnosc from './pages/Platnosc';
import Produkt from './pages/Produkt';
import Rejestracja from './pages/Rejestracja';

function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route element={<Glowna />} path="/" />
          <Route element={<Produkt />} path="/produkt/:id" />
          <Route element={<Platnosc />} path="/platnosc/:id" />
          <Route element={<Rejestracja />} path="/rejestracja" />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
