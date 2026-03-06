import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createProduct, listCategories, normalizeApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Category, Product } from '../lib/types';

export function ProductCreatePage() {
  const { token, isAdmin, isMerchant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [variationType, setVariationType] = useState('NONE');
  const [description, setDescription] = useState('');
  const [about, setAbout] = useState('');
  const [detailBrand, setDetailBrand] = useState('Generic');
  const [detailSeries, setDetailSeries] = useState('Base');
  const [detailCapacity, setDetailCapacity] = useState('512');
  const [detailCapacityUnit, setDetailCapacityUnit] = useState<'GB' | 'TB'>(
    'GB',
  );
  const [detailCapacityType, setDetailCapacityType] = useState<'SSD' | 'HD'>(
    'SSD',
  );

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      setLoadingCategories(true);
      setError(null);
      try {
        const data = await listCategories();
        if (!ignore) {
          setCategories(data);
          if (data.length > 0) {
            setCategoryId(String(data[0].id));
          }
        }
      } catch (err) {
        const apiError = normalizeApiError(err);
        if (!ignore) {
          setError(apiError.message);
        }
      } finally {
        if (!ignore) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();
    return () => {
      ignore = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Missing auth token');
      return;
    }

    setSaving(true);
    setError(null);
    setCreatedProduct(null);

    try {
      const product = await createProduct(
        {
          categoryId: Number(categoryId),
          title: title.trim(),
          code: code.trim(),
          variationType,
          description: description.trim(),
          about: about
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          details: {
            category: 'Computers',
            brand: detailBrand.trim(),
            series: detailSeries.trim(),
            capacity: Number(detailCapacity),
            capacityUnit: detailCapacityUnit,
            capacityType: detailCapacityType,
          },
        },
        token,
      );
      setCreatedProduct(product);
      setTitle('');
      setCode('');
      setVariationType('NONE');
      setDescription('');
      setAbout('');
      setDetailBrand('Generic');
      setDetailSeries('Base');
      setDetailCapacity('512');
      setDetailCapacityUnit('GB');
      setDetailCapacityType('SSD');
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin && !isMerchant) {
    return (
      <section className="card panel">
        <h2>Create Product</h2>
        <p className="muted">This action requires Admin or Merchant role.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <article className="card panel">
        <h2>Create Product</h2>
        <p className="muted">
          Complete the product data here so activation can work without extra fixes.
        </p>

        {loadingCategories && <p className="muted">Loading categories...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loadingCategories && (
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              <span>Category</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} (#{category.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Gaming Laptop"
                required
              />
            </label>

            <label>
              <span>Code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="SKU-12345"
                required
              />
            </label>

            <label>
              <span>Variation Type</span>
              <select
                value={variationType}
                onChange={(event) => setVariationType(event.target.value)}
              >
                <option value="NONE">NONE</option>
                <option value="OnlySize">OnlySize</option>
                <option value="OnlyColor">OnlyColor</option>
                <option value="SizeAndColor">SizeAndColor</option>
              </select>
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>

            <label>
              <span>About (comma separated)</span>
              <input
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                placeholder="Portable, Lightweight"
                required
              />
            </label>

            <h3>Technical details</h3>

            <label>
              <span>Brand</span>
              <input
                value={detailBrand}
                onChange={(event) => setDetailBrand(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Series</span>
              <input
                value={detailSeries}
                onChange={(event) => setDetailSeries(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Capacity</span>
              <input
                type="number"
                min={1}
                value={detailCapacity}
                onChange={(event) => setDetailCapacity(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Capacity Unit</span>
              <select
                value={detailCapacityUnit}
                onChange={(event) =>
                  setDetailCapacityUnit(event.target.value as 'GB' | 'TB')
                }
              >
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </label>

            <label>
              <span>Capacity Type</span>
              <select
                value={detailCapacityType}
                onChange={(event) =>
                  setDetailCapacityType(event.target.value as 'SSD' | 'HD')
                }
              >
                <option value="SSD">SSD</option>
                <option value="HD">HD</option>
              </select>
            </label>

            <button
              className="primary-btn"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        )}

        {createdProduct && (
          <div className="success-box">
            <p>Product #{createdProduct.id} created successfully.</p>
            <Link to={`/products/${createdProduct.id}`}>Open product detail</Link>
          </div>
        )}
      </article>
    </section>
  );
}
