import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  activateProduct,
  addProductDetails,
  deactivateProduct,
  getProduct,
  getProductEvents,
  normalizeApiError,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Product, ProductEvent } from '../lib/types';

export function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params.id);
  const { token, user, isAdmin, isMerchant } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [events, setEvents] = useState<ProductEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const canManageProducts = isAdmin || isMerchant;
  const canManageThisProduct =
    !!product && (isAdmin || (isMerchant && product.merchantId === user?.id));
  const readOnlyDetails = canManageProducts && !canManageThisProduct;

  useEffect(() => {
    if (!product) {
      return;
    }

    const details = product.details ?? {};
    const detailsBrand =
      typeof details.brand === 'string' && details.brand.trim().length > 0
        ? details.brand
        : 'Generic';
    const detailsSeries =
      typeof details.series === 'string' && details.series.trim().length > 0
        ? details.series
        : 'Base';

    const rawCapacity =
      typeof details.capacity === 'number' || typeof details.capacity === 'string'
        ? Number(details.capacity)
        : 512;
    const detailsCapacity = Number.isFinite(rawCapacity) && rawCapacity > 0
      ? rawCapacity
      : 512;
    const detailsCapacityUnit = details.capacityUnit === 'TB' ? 'TB' : 'GB';
    const detailsCapacityType = details.capacityType === 'HD' ? 'HD' : 'SSD';

    setTitle(product.title ?? '');
    setCode(product.code ?? '');
    setVariationType(product.variationType ?? 'NONE');
    setDescription(product.description ?? '');
    setAbout(product.about?.join(', ') ?? '');
    setDetailBrand(detailsBrand);
    setDetailSeries(detailsSeries);
    setDetailCapacity(String(detailsCapacity));
    setDetailCapacityUnit(detailsCapacityUnit);
    setDetailCapacityType(detailsCapacityType);
  }, [product]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!Number.isInteger(productId) || productId < 1) {
        setError('Invalid product id');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [productData, eventData] = await Promise.all([
          getProduct(productId),
          getProductEvents(productId),
        ]);

        if (!ignore) {
          setProduct(productData);
          setEvents(eventData);
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

    void loadData();
    return () => {
      ignore = true;
    };
  }, [productId]);

  async function reloadProductData() {
    if (!Number.isInteger(productId) || productId < 1) {
      return;
    }

    const [productData, eventData] = await Promise.all([
      getProduct(productId),
      getProductEvents(productId),
    ]);
    setProduct(productData);
    setEvents(eventData);
  }

  async function onSubmitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !product || !canManageThisProduct) {
      return;
    }

    setDetailsLoading(true);
    setActionMessage(null);
    setError(null);

    try {
      const parsedCapacity = Number(detailCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
        setError('Capacity must be a number greater than 0');
        setDetailsLoading(false);
        return;
      }

      const payload = {
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
          capacity: parsedCapacity,
          capacityUnit: detailCapacityUnit,
          capacityType: detailCapacityType,
        },
      };

      await addProductDetails(product.id, payload, token);
      await reloadProductData();
      setActionMessage('Product details updated');
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function onActivate() {
    if (!token || !product || !canManageThisProduct) {
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    setError(null);
    try {
      await activateProduct(product.id, token);
      await reloadProductData();
      setActionMessage('Product activated');
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function onDeactivate() {
    if (!token || !product || !canManageThisProduct) {
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    setError(null);
    try {
      await deactivateProduct(product.id, token);
      await reloadProductData();
      setActionMessage('Product deactivated');
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <section className="card panel">Loading product...</section>;
  }

  if (error && !product) {
    return (
      <section className="card panel">
        <h2>Product detail</h2>
        <p className="error-text">{error}</p>
      </section>
    );
  }

  const currentStatusLabel = product?.isActive ? 'Active' : 'Inactive';
  const productDetails = (product?.details ?? {}) as Record<string, unknown>;
  const detailsCategory =
    typeof productDetails.category === 'string' && productDetails.category.trim()
      ? productDetails.category
      : '-';
  const detailsBrand =
    typeof productDetails.brand === 'string' && productDetails.brand.trim()
      ? productDetails.brand
      : '-';
  const detailsSeries =
    typeof productDetails.series === 'string' && productDetails.series.trim()
      ? productDetails.series
      : '-';
  const detailsCapacity =
    typeof productDetails.capacity === 'number' ||
    typeof productDetails.capacity === 'string'
      ? String(productDetails.capacity)
      : '-';
  const detailsCapacityUnit =
    typeof productDetails.capacityUnit === 'string' &&
    productDetails.capacityUnit.trim()
      ? productDetails.capacityUnit
      : '-';
  const detailsCapacityType =
    typeof productDetails.capacityType === 'string' &&
    productDetails.capacityType.trim()
      ? productDetails.capacityType
      : '-';
  const aboutSummary = product?.about?.length ? product.about.join(', ') : '-';

  return (
    <section className="stack">
      <article className="card panel">
        <header className="section-header">
          <div>
            <h2>Product #{product?.id}</h2>
            <p className="muted">
              Status:{' '}
              <span className={product?.isActive ? 'badge success' : 'badge muted-badge'}>
                {product?.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div className="inline-actions lifecycle-actions">
            {canManageThisProduct ? (
              <button
                type="button"
                className={
                  product?.isActive
                    ? 'secondary-btn small-btn lifecycle-action-btn'
                    : 'primary-btn small-btn lifecycle-action-btn'
                }
                disabled={actionLoading}
                onClick={product?.isActive ? onDeactivate : onActivate}
              >
                {actionLoading
                  ? 'Saving...'
                  : product?.isActive
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
            ) : (
              <button
                type="button"
                className="secondary-btn small-btn lifecycle-action-btn"
                disabled
                aria-disabled="true"
                title="Informational status"
              >
                {currentStatusLabel}
              </button>
            )}
          </div>
        </header>

        <dl className="meta-grid">
          <div>
            <dt>Title</dt>
            <dd>{product?.title ?? '-'}</dd>
          </div>
          <div>
            <dt>Code</dt>
            <dd>{product?.code ?? '-'}</dd>
          </div>
          <div>
            <dt>Category ID</dt>
            <dd>{product?.categoryId ?? '-'}</dd>
          </div>
          <div>
            <dt>Merchant ID</dt>
            <dd>{product?.merchantId ?? '-'}</dd>
          </div>
        </dl>

        <dl className="meta-grid">
          <div>
            <dt>Variation</dt>
            <dd>{product?.variationType ?? '-'}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{detailsCategory}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd className="meta-value-wrap">{product?.description ?? '-'}</dd>
          </div>
          <div>
            <dt>About</dt>
            <dd className="meta-value-wrap">{aboutSummary}</dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{detailsBrand}</dd>
          </div>
          <div>
            <dt>Series</dt>
            <dd>{detailsSeries}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>
              {detailsCapacity} {detailsCapacityUnit}
            </dd>
          </div>
          <div>
            <dt>Storage Type</dt>
            <dd>{detailsCapacityType}</dd>
          </div>
        </dl>

        {error && <p className="error-text">{error}</p>}
        {actionMessage && <p className="success-text">{actionMessage}</p>}
      </article>

      {canManageProducts && (
        <article className="card panel">
          <h3>Complete Product Details</h3>
          <p className="muted">
            Use category <strong>Computers</strong> for this demo payload shape.
          </p>
          {readOnlyDetails && (
            <p className="notice-text">
              Read only: merchants can edit only their own products.
            </p>
          )}

          <form className="form-grid" onSubmit={onSubmitDetails}>
            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <label>
              <span>Code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <label>
              <span>Variation Type</span>
              <select
                value={variationType}
                onChange={(event) => setVariationType(event.target.value)}
                disabled={readOnlyDetails || detailsLoading}
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
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <label>
              <span>About (comma separated)</span>
              <input
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                required
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <h3>Technical details</h3>

            <label>
              <span>Brand</span>
              <input
                value={detailBrand}
                onChange={(event) => setDetailBrand(event.target.value)}
                required
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <label>
              <span>Series</span>
              <input
                value={detailSeries}
                onChange={(event) => setDetailSeries(event.target.value)}
                required
                disabled={readOnlyDetails || detailsLoading}
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
                disabled={readOnlyDetails || detailsLoading}
              />
            </label>

            <label>
              <span>Capacity Unit</span>
              <select
                value={detailCapacityUnit}
                onChange={(event) =>
                  setDetailCapacityUnit(event.target.value as 'GB' | 'TB')
                }
                disabled={readOnlyDetails || detailsLoading}
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
                disabled={readOnlyDetails || detailsLoading}
              >
                <option value="SSD">SSD</option>
                <option value="HD">HD</option>
              </select>
            </label>

            <button
              type="submit"
              className="primary-btn"
              disabled={readOnlyDetails || detailsLoading}
            >
              {readOnlyDetails
                ? 'Read only'
                : detailsLoading
                  ? 'Saving details...'
                  : 'Save details'}
            </button>
          </form>
        </article>
      )}

      <article className="card panel">
        <h3>Event Timeline</h3>
        {events.length === 0 ? (
          <p className="muted">No events for this product yet.</p>
        ) : (
          <ul className="timeline-list">
            {events.map((eventRow) => (
              <li key={eventRow.id}>
                <div>
                  <p className="timeline-type">{eventRow.type}</p>
                  <p className="muted">
                    {new Date(eventRow.occurredAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
