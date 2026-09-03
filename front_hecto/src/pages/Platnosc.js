import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = imageLink => {
  if (!imageLink) {
    return '';
  }

  if (/^https?:\/\//i.test(imageLink)) {
    return imageLink;
  }

  return `${API_URL}/${String(imageLink).replace(/^\/+/, '')}`;
};

const Platnosc = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [account] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hecto-account')) || null;
    } catch {
      return null;
    }
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Nie udalo sie pobrac produktu');
        }

        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getProduct();
  }, [id]);

  const pay = async () => {
    setMessage('');

    if (!account) {
      setMessage('Musisz sie zarejestrowac, zeby kupic produkt.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          productId: Number(id)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nie udalo sie zlozyc zamowienia');
      }

      setMessage(`Platnosc wybrana: ${paymentMethod}. Zamowienie przyjete.`);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return (
      <main className="container py-4">
        <div className="alert alert-info">Ladowanie platnosci...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-4">
        <Link className="btn btn-outline-light mb-3" to={`/produkt/${id}`}>
          Wroc do produktu
        </Link>
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <Link className="btn btn-outline-light mb-3" to={`/produkt/${id}`}>
        Wroc do produktu
      </Link>

      <div className="card payment-card">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button className="nav-link active" type="button">
                Platnosc
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          <h1 className="h3 fw-bold mb-4">Platnosc za produkt</h1>

          <div className="row g-4">
            <div className="col-md-5">
              <div className="border rounded p-3 h-100">
                {getImageUrl(product.image_link) ? (
                  <img className="payment-product-img mb-3" src={getImageUrl(product.image_link)} alt={product.prod_name} />
                ) : (
                  <div className="payment-product-img product-img-placeholder mb-3">Hecto</div>
                )}
                <h2 className="h5">{product.prod_name}</h2>
                <p className="text-secondary mb-2">{product.description}</p>
                <p className="fs-5 fw-bold mb-0">{Number(product.cost || 0).toFixed(2)} zl</p>
              </div>
            </div>

            <div className="col-md-7">
              {account ? (
                <div>
                  <div className="alert alert-success">
                    <strong>Dane konta:</strong> {account.fname} {account.lname}, {account.email}
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="payment-method">
                      Metoda platnosci
                    </label>
                    <select
                      className="form-select"
                      id="payment-method"
                      value={paymentMethod}
                      onChange={event => setPaymentMethod(event.target.value)}
                    >
                      <option value="card">Karta platnicza</option>
                      <option value="blik">BLIK</option>
                      <option value="transfer">Przelew online</option>
                      <option value="cash">Platnosc przy odbiorze</option>
                    </select>
                  </div>

                  <button className="btn btn-primary btn-lg" type="button" onClick={pay}>
                    Place
                  </button>
                </div>
              ) : (
                <div className="alert alert-warning mb-0">
                  <p className="mb-3">Musisz sie zarejestrowac, zeby przejsc do platnosci.</p>
                  <Link className="btn btn-primary" to={`/rejestracja?productId=${id}`}>
                    Przejdz do rejestracji
                  </Link>
                </div>
              )}
            </div>
          </div>

          {message && <div className="alert alert-info mt-4 mb-0">{message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Platnosc;
