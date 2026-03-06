import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductEvents,
  listProducts,
  normalizeApiError,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Product, ProductEvent } from '../lib/types';

type TimelineEvent = ProductEvent & {
  productTitle: string;
};

export function DashboardPage() {
  const { isAdmin, isMerchant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((item) => item.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [products]);

  const recentProducts = useMemo(() => products.slice(0, 6), [products]);
  const canCreate = isAdmin || isMerchant;

  async function loadDashboard() {
    setError(null);

    try {
      const latestProducts = await listProducts();
      const recentCandidates = latestProducts.slice(0, 8);
      const eventGroups = await Promise.all(
        recentCandidates.map(async (product) => {
          try {
            const productEvents = await getProductEvents(product.id);
            return productEvents.map((event) => ({
              ...event,
              productTitle: product.title ?? `Producto #${product.id}`,
            }));
          } catch {
            return [];
          }
        }),
      );

      const recentEvents = eventGroups
        .flat()
        .sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        )
        .slice(0, 6);

      setProducts(latestProducts);
      setEvents(recentEvents);
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <section className="stack dashboard-stack">
      {canCreate && (
        <article className="card panel">
          <header className="section-header">
            <h3>Acciones rápidas</h3>
          </header>
          <div className="inline-actions">
            <Link className="primary-btn as-link" to="/products/new">
              Crear producto
            </Link>
            <Link className="secondary-btn as-link" to="/products">
              Ver productos
            </Link>
            {isAdmin && (
              <Link className="secondary-btn as-link" to="/admin/roles">
                Gestionar roles
              </Link>
            )}
          </div>
        </article>
      )}

      <section className="dashboard-grid">
        <article className="card panel metric-card">
          <p className="metric-label">Productos</p>
          <p className="metric-value">{metrics.total}</p>
          <p className="muted">Total en catálogo</p>
        </article>
        <article className="card panel metric-card">
          <p className="metric-label">Activos</p>
          <p className="metric-value">{metrics.active}</p>
          <p className="muted">Disponibles para operar</p>
        </article>
        <article className="card panel metric-card">
          <p className="metric-label">Inactivos</p>
          <p className="metric-value">{metrics.inactive}</p>
          <p className="muted">Pendientes de activación</p>
        </article>
      </section>

      {error && (
        <article className="card panel">
          <p className="error-text">{error}</p>
        </article>
      )}

      <section className="dashboard-main-grid">
        <article className="card panel">
          <header className="section-header">
            <h3>Productos recientes</h3>
            <Link to="/products">Ver todos</Link>
          </header>
          {recentProducts.length === 0 ? (
            <p className="muted">No hay productos todavía.</p>
          ) : (
            <ul className="dashboard-list">
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <div>
                    <p className="dashboard-list-title">
                      {product.title ?? `Producto #${product.id}`}
                    </p>
                    <p className="muted">Código: {product.code ?? '-'}</p>
                  </div>
                  <span className={product.isActive ? 'badge success' : 'badge muted-badge'}>
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card panel">
          <header className="section-header">
            <h3>Eventos recientes</h3>
            <Link to="/products">Ir a detalle</Link>
          </header>
          {events.length === 0 ? (
            <p className="muted">No hay eventos recientes.</p>
          ) : (
            <ul className="dashboard-list">
              {events.map((event) => (
                <li key={event.id}>
                  <div>
                    <p className="dashboard-list-title">{event.type}</p>
                    <p className="muted">
                      {event.productTitle} · {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </div>
                  <Link to={`/products/${event.productId}`}>Detail</Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

    </section>
  );
}
