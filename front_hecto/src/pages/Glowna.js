import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const Glowna = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Nie udalo sie pobrac produktow');
        }

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  const genres = useMemo(() => {
    const uniqueGenres = new Map();

    products.forEach(product => {
      if (product.genre_id && product.genre_name) {
        uniqueGenres.set(String(product.genre_id), product.genre_name);
      }
    });

    return Array.from(uniqueGenres, ([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return products.filter(product => {
      const nameMatches = product.prod_name?.toLowerCase().includes(searchValue);
      const genreMatches = genre === 'all' || String(product.genre_id) === genre;

      return nameMatches && genreMatches;
    });
  }, [products, search, genre]);

  const goToProduct = productId => {
    navigate(`/produkt/${productId}`);
  };

  return (
    <main className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Produkty Hecto</h1>
          <p className="text-secondary mb-0">Pobieranie produktow z serwera i filtrowanie po genre.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <label className="form-label" htmlFor="search">
            Szukaj po nazwie
          </label>
          <input
            className="form-control"
            id="search"
            type="search"
            placeholder="Wpisz nazwe produktu..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label" htmlFor="genre">
            Genre
          </label>
          <select
            className="form-select"
            id="genre"
            value={genre}
            onChange={event => setGenre(event.target.value)}
          >
            <option value="all">Wszystkie</option>
            {genres.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="alert alert-info">Ladowanie produktow...</div>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="alert alert-dark border-secondary">Brak produktow pasujacych do filtrow.</div>
      )}

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredProducts.map(product => (
          <div className="col" key={product.id}>
            <div
              className="card h-100 product-card"
              role="button"
              tabIndex="0"
              onClick={() => goToProduct(product.id)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  goToProduct(product.id);
                }
              }}
            >
              {getImageUrl(product.image_link) ? (
                <img
                  src={getImageUrl(product.image_link)}
                  className="card-img-top product-img"
                  alt={product.prod_name}
                />
              ) : (
                <div className="product-img product-img-placeholder">Hecto</div>
              )}

              <div className="card-body">
                <h2 className="h5 card-title">{product.prod_name}</h2>
                <p className="card-text text-secondary">{product.description}</p>
              </div>

              <div className="card-footer d-flex justify-content-between align-items-center">
                <span className="fw-bold">{Number(product.cost || 0).toFixed(2)} zl</span>
                <span className="badge text-bg-info">{product.genre_name || 'brak genre'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Glowna;
