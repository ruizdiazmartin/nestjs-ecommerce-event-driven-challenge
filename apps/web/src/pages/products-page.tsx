import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  activateProduct,
  deactivateProduct,
  listProducts,
  normalizeApiError,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Product } from '../lib/types';

type StatusFilter = 'all' | 'active' | 'inactive';

function getStatusLabel(product: Product) {
  return product.isActive ? 'Active' : 'Inactive';
}

export function ProductsPage() {
  const { user, isAdmin, isMerchant, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [onlyMine, setOnlyMine] = useState(isMerchant && !isAdmin);

  const canManageProducts = isAdmin || isMerchant;
  const canCreateProducts = isAdmin;

  const filters = useMemo(() => {
    const next: { active?: boolean; merchantId?: number } = {};
    if (statusFilter === 'active') {
      next.active = true;
    }
    if (statusFilter === 'inactive') {
      next.active = false;
    }
    if (onlyMine && user?.id) {
      next.merchantId = user.id;
    }
    return next;
  }, [onlyMine, statusFilter, user?.id]);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const data = await listProducts(filters);
        if (!ignore) {
          setProducts(data);
        }
      } catch (err) {
        const apiError = normalizeApiError(err);
        if (!ignore) {
          setError(apiError.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, [filters]);

  async function updateStatus(product: Product) {
    if (!canManageProducts || !token) {
      return;
    }

    setActionLoadingId(product.id);
    setError(null);
    try {
      if (product.isActive) {
        await deactivateProduct(product.id, token);
      } else {
        await activateProduct(product.id, token);
      }
      const updated = await listProducts(filters);
      setProducts(updated);
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <section className="stack">
      <article className="card panel">
        <header className="section-header">
          <div>
            <h2>Products</h2>
            <p className="muted">Catalog, lifecycle status, and event-driven actions.</p>
          </div>
          {canCreateProducts && (
            <Link className="primary-btn as-link" to="/products/new">
              New Product
            </Link>
          )}
        </header>

        {isMerchant && (
          <p className="notice-text">
            Merchant can activate/deactivate only own products. Other products are read-only.
          </p>
        )}
        {!isAdmin && !isMerchant && (
          <p className="notice-text">
            You are in read-only mode. Only Admin or Merchant can perform lifecycle actions.
          </p>
        )}

        <div className="filters">
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          {canManageProducts && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(event) => setOnlyMine(event.target.checked)}
              />
              <span>Only my products</span>
            </label>
          )}
        </div>

        {loading && <p className="muted">Loading products...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="muted">No products found with current filters.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Lifecycle</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const canManageThisProduct =
                    isAdmin || (isMerchant && product.merchantId === user?.id);

                  return (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.title ?? '-'}</td>
                      <td>{product.code ?? '-'}</td>
                      <td>{product.categoryId ?? '-'}</td>
                      <td>{product.merchantId ?? '-'}</td>
                      <td>
                        <span
                          className={
                            product.isActive ? 'badge success' : 'badge muted-badge'
                          }
                        >
                          {getStatusLabel(product)}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions lifecycle-actions">
                          {canManageThisProduct && (
                            <button
                              type="button"
                              className={
                                product.isActive
                                  ? 'secondary-btn small-btn lifecycle-action-btn'
                                  : 'primary-btn small-btn lifecycle-action-btn'
                              }
                              disabled={actionLoadingId === product.id}
                              onClick={() => updateStatus(product)}
                            >
                              {actionLoadingId === product.id
                                ? 'Saving...'
                                : product.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                            </button>
                          )}
                          {!canManageThisProduct && (
                            <button
                              type="button"
                              className="secondary-btn small-btn lifecycle-action-btn"
                              disabled
                              aria-disabled="true"
                              title="Read only"
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </button>
                          )}
                          <Link className="detail-link" to={`/products/${product.id}`}>
                            Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
