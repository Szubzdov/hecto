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

const Produkt = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <main className="container py-4">
        <div className="alert alert-info">Ladowanie produktu #{id}...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-4">
        <Link className="btn btn-outline-light mb-3" to="/">
          Wroc do produktow
        </Link>
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <Link className="btn btn-outline-light mb-3" to="/">
        Wroc do produktow
      </Link>

      <div className="card product-details">
        <div className="row g-0">
          <div className="col-md-5">
            {getImageUrl(product.image_link) ? (
              <img
                className="img-fluid rounded-start details-img"
                src={getImageUrl(product.image_link)}
                alt={product.prod_name}
              />
            ) : (
              <div className="details-img product-img-placeholder">Hecto</div>
            )}
          </div>

          <div className="col-md-7">
            <div className="card-body">
              <p className="text-info fw-semibold mb-2">ID produktu: {id}</p>
              <h1 className="card-title fw-bold">{product.prod_name}</h1>
              <p className="card-text text-secondary">{product.description}</p>
              <p className="fs-4 fw-bold mb-3">{Number(product.cost || 0).toFixed(2)} zl</p>
              <span className="badge text-bg-info">{product.genre_name || 'brak genre'}</span>

              <div className="mt-4">
                <Link className="btn btn-primary btn-lg" to={`/platnosc/${id}`}>
                  Zamow
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Produkt;
