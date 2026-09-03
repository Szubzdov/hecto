import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Rejestracja = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  const register = async event => {
    event.preventDefault();
    setMessage('Tworzenie konta...');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatar_id: 1 })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nie udalo sie utworzyc konta');
      }

      localStorage.setItem('hecto-account', JSON.stringify(data.account));
      setMessage('Konto utworzone.');
      navigate(productId ? `/platnosc/${productId}` : '/');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <main className="container py-4">
      <Link className="btn btn-outline-light mb-3" to={productId ? `/platnosc/${productId}` : '/'}>
        Wroc
      </Link>

      <div className="card register-card">
        <div className="card-body">
          <h1 className="h3 fw-bold mb-3">Rejestracja</h1>
          <p className="text-secondary">Utworz konto, zeby przejsc do platnosci.</p>

          <form className="register-form" onSubmit={register}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="fname">
                  Imie
                </label>
                <input
                  className="form-control"
                  id="fname"
                  value={form.fname}
                  onChange={event => setForm({ ...form, fname: event.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="lname">
                  Nazwisko
                </label>
                <input
                  className="form-control"
                  id="lname"
                  value={form.lname}
                  onChange={event => setForm({ ...form, lname: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3 mt-3">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                className="form-control"
                id="email"
                type="email"
                value={form.email}
                onChange={event => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Haslo
              </label>
              <input
                className="form-control"
                id="password"
                type="password"
                value={form.password}
                onChange={event => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>

            <button className="btn btn-primary btn-lg" type="submit">
              Zarejestruj
            </button>
          </form>

          {message && <div className="alert alert-info mt-4 mb-0">{message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Rejestracja;
