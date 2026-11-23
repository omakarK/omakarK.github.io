import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const tabs = ['Orders', 'Products', 'Categories', 'Offers', 'Traffic'];
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const productFields = [
  ['subtitle', 'Subtitle', 180], ['badge', 'Badge', 60], ['woodType', 'Wood type', 120],
  ['recommendedAge', 'Recommended age', 80], ['dimensions', 'Dimensions', 100],
  ['weight', 'Weight', 80], ['finish', 'Finish', 120], ['leadTime', 'Dispatch estimate', 160]
];
const currency = rupees => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0
}).format(rupees);
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const displayStatus = status => status.charAt(0).toUpperCase() + status.slice(1);
const fieldsOf = form => Object.fromEntries(new FormData(form));

async function request(path, method, data, csrf) {
  const headers = {};
  if (csrf) headers['X-CSRF-Token'] = csrf;
  if (data !== undefined && !(data instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`/api/admin/${path}`, {
    method, headers, body: data instanceof FormData ? data : JSON.stringify(data)
  });
  if (response.status === 204) return;
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.message || (response.status === 429
      ? 'Too many requests. Wait a moment and try again.'
      : 'The shop could not complete your request.'));
    error.status = response.status;
    throw error;
  }
  if (!result) throw new Error('The shop returned an incomplete response.');
  return result;
}

function uploadForm(data, files) {
  const form = new FormData();
  form.append('data', JSON.stringify(data));
  for (const file of files) if (file.size) form.append('media', file);
  return form;
}

function Modal({ title, onClose, busy, children }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="dialog" aria-labelledby="editor-title" onCancel={event => {
    event.preventDefault();
    if (!busy) onClose();
  }}>
    <div className="dialog-head"><h2 id="editor-title">{title}</h2>
      <button type="button" className="text-button" disabled={busy} onClick={onClose}>Close</button>
    </div>
    {children}
  </dialog>;
}

function ProductEditor({ item, categories, onSave, busy }) {
  return <form onSubmit={event => {
    event.preventDefault();
    const values = fieldsOf(event.currentTarget);
    const { media, ...data } = values;
    onSave(uploadForm({
      ...data, price: Math.round(Number(data.price) * 100),
      originalPrice: data.originalPrice ? Math.round(Number(data.originalPrice) * 100) : null,
      inStock: Number(data.inStock), expectedStock: item?.inStock,
      active: Boolean(data.active), engravable: Boolean(data.engravable), removeImage: Boolean(data.removeImage)
    }, [media]));
  }}>
    <div className="fields">
      <label>Product name<input name="name" defaultValue={item?.name} maxLength={150} required /></label>
      <label>Category<select name="category" defaultValue={item?.category || ''} required>
        <option value="" disabled>Choose a category</option>
        {categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
      </select></label>
      <label>Price (₹)<input name="price" type="number" min="0.01" max="1000000" step="0.01" defaultValue={item?.price} required /></label>
      <label>Original price (₹)<input name="originalPrice" type="number" min="0.01" max="1000000" step="0.01" defaultValue={item?.originalPrice ?? ''} /></label>
      <label>Units in stock<input name="inStock" type="number" min="0" max="100000" defaultValue={item?.inStock ?? 0} required /></label>
      <label>{item ? 'Replace photo' : 'Product photo'}<input name="media" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      {item && <label className="check span"><input type="checkbox" name="removeImage" /> Remove current photo</label>}
      <label className="check"><input type="checkbox" name="active" defaultChecked={item?.active ?? true} /> Publish on storefront</label>
      <label className="check"><input type="checkbox" name="engravable" defaultChecked={item?.engravable ?? false} /> Available for engraving</label>
      {productFields.map(([name, label, limit]) =>
        <label key={name}>{label}<input name={name} defaultValue={item?.[name]} maxLength={limit} /></label>)}
      <label className="span">Description<textarea name="description" defaultValue={item?.description} maxLength={4000} rows={4} /></label>
    </div>
    <button className="primary" disabled={busy || !categories.length}>{busy ? 'Saving…' : 'Save product'}</button>
    {!categories.length && <p>Add a category before saving a product.</p>}
  </form>;
}

function CategoryEditor({ item, onSave, busy }) {
  return <form onSubmit={event => {
    event.preventDefault();
    const { name, position } = fieldsOf(event.currentTarget);
    onSave({ name, position: Number(position) });
  }}>
    <div className="fields">
      <label>Name<input name="name" defaultValue={item?.name} maxLength={80} required /></label>
      <label>Sort order<input name="position" type="number" min="0" max="999" defaultValue={item?.position ?? 0} required /></label>
    </div>
    <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button>
  </form>;
}

function OfferEditor({ item, products, onSave, busy }) {
  const [lines, setLines] = useState(() => (item?.items || []).map(line => ({ ...line, key: crypto.randomUUID() })));
  const [removeMedia, setRemoveMedia] = useState([]);
  const productsById = new Map(products.map(product => [product.id, product]));
  const retail = lines.reduce((sum, line) => sum + (productsById.get(line.id)?.price || 0) * Number(line.quantity), 0);
  const updateLine = (key, changes) => setLines(previous => previous.map(line => line.key === key ? { ...line, ...changes } : line));
  return <form onSubmit={event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    onSave(uploadForm({
      title: values.get('title'), description: values.get('description'), active: values.has('active'),
      price: Math.round(Number(values.get('price')) * 100), removeMedia,
      items: lines.map(({ id, quantity }) => ({ id, quantity: Number(quantity) }))
    }, values.getAll('media')));
  }}>
    <div className="fields">
      <label>Offer name<input name="title" defaultValue={item?.title} maxLength={150} required /></label>
      <label>Combo price (₹)<input name="price" type="number" min="0.01" max="1000000" step="0.01" defaultValue={item?.price} required /></label>
      <label className="span">Description<textarea name="description" defaultValue={item?.description} maxLength={2500} rows={3} /></label>
      <label className="check span"><input type="checkbox" name="active" defaultChecked={item?.active ?? true} /> Publish on storefront</label>
    </div>
    <fieldset>
      <legend>Included toys</legend>
      {lines.map(line => <div className="combo-line" key={line.key}>
        <label>Product<select value={line.id} required onChange={event => updateLine(line.key, { id: event.target.value })}>
          <option value="" disabled>Choose a toy</option>
          {products.map(product => <option key={product.id} value={product.id}>{product.name}{product.active ? '' : ' (unpublished)'}</option>)}
        </select></label>
        <label>Quantity<input value={line.quantity} type="number" min="1" max="20" required onChange={event => updateLine(line.key, { quantity: event.target.value })} /></label>
        <button type="button" className="text-button" onClick={() => setLines(lines.filter(current => current.key !== line.key))}>Remove</button>
      </div>)}
      <div className="row"><button type="button" disabled={lines.length >= 20 || !products.length}
        onClick={() => setLines([...lines, { id: '', quantity: 1, key: crypto.randomUUID() }])}>Add a toy</button>
        <span>Combined retail price {currency(retail)}</span></div>
    </fieldset>
    <fieldset>
      <legend>Photos and videos</legend>
      {item?.media?.length > 0 && <div className="media-list">{item.media.map(media => <div className="media-item" key={media.id}>
        {media.type.startsWith('image/')
          ? <img src={media.url} alt="Offer upload" />
          : <video src={media.url} controls preload="metadata" aria-label="Offer video" />}
        <label className="check"><input type="checkbox" checked={removeMedia.includes(media.id)} onChange={event =>
          setRemoveMedia(event.target.checked ? [...removeMedia, media.id] : removeMedia.filter(id => id !== media.id))} /> Remove</label>
      </div>)}</div>}
      <label>Add files<input name="media" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" /></label>
      <p className="muted">Up to 8 files per offer. Photos up to 5 MB and MP4 or WebM videos up to 30 MB. Each upload request can total up to 45 MB.</p>
    </fieldset>
    <button className="primary" disabled={busy || !lines.length}>{busy ? 'Saving…' : 'Save offer'}</button>
  </form>;
}

function CatalogTable({ tab, items, categories, edit, remove }) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));
  const products = tab === 'Products';
  const offers = tab === 'Offers';
  const pricing = products || offers;
  if (!items.length) return <p className="state">No {tab.toLowerCase()} yet.</p>;
  return <div className="table-scroll"><table>
    <thead><tr><th>Name</th>{products && <th>Category</th>}
      {pricing ? <><th>Price</th><th>In stock</th><th>Visibility</th></> : <th>Sort order</th>}
      <th>Actions</th></tr></thead>
    <tbody>{items.map(item => <tr key={item.id}>
      <th scope="row"><div className="item-name">
        {pricing && <img src={item.image} alt="" loading="lazy" />}
        <span>{item.name || item.title}</span>
      </div></th>
      {products && <td>{categoryNames.get(item.category)}</td>}
      {pricing ? <><td>{currency(item.price)}</td><td>{item.inStock}</td>
        <td>{item.active ? (offers && !item.eligible ? 'Unavailable' : 'Published') : 'Unpublished'}</td></> : <td>{item.position}</td>}
      <td><div className="row"><button type="button" onClick={() => edit(item)}>Edit</button>
        <button type="button" className="danger" onClick={() => remove(item)}>Delete</button></div></td>
    </tr>)}</tbody>
  </table></div>;
}

function OrderCard({ order, save }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const customer = order.customer;
  return <details className="order-card">
    <summary><strong>{order.id}</strong><span>{dateTime.format(order.created_at)}</span>
      <span>{customer.name}</span><span>{displayStatus(order.status)}</span><strong>{currency((order.subtotal + order.shipping) / 100)}</strong></summary>
    <div className="order-detail">
      <div className="order-columns">
        <div><h3>Delivery details</h3>
          <p>{customer.name}<br />{customer.address}<br />{customer.city}, {customer.state} {customer.postalCode}<br />{customer.country}</p>
          <p>{customer.phone}<br />{customer.email}</p>
        </div>
        <div><h3>Items</h3><ul>{order.items.map((item, index) => <li key={index}>{item.quantity} × {item.name} · {currency(item.quantity * item.unitPrice / 100)}
          {item.components && <ul>{item.components.map(part => <li key={part.id}>{part.quantity * item.quantity} × {part.name}</li>)}</ul>}
          {item.personalization && <div className="muted">{item.personalization.name} {item.personalization.date} · {item.personalization.finish} · {displayStatus(item.personalization.font)}</div>}
        </li>)}</ul>
        <p>Shipping {order.shipping ? currency(order.shipping / 100) : 'free'} · Cash on delivery</p></div>
      </div>
      <form className="order-update" onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setFeedback('');
        try {
          await save(order.id, { ...fieldsOf(event.currentTarget), expectedStatus: order.status });
        } catch (error) {
          setFeedback(error.message);
        } finally {
          setBusy(false);
        }
      }}>
        <label>Status<select name="status" defaultValue={order.status} key={order.status}>
          {[order.status, ...order.nextStatuses].map(status => <option key={status} value={status}>{displayStatus(status)}</option>)}
        </select></label>
        <label>Tracking details<input name="tracking" defaultValue={order.tracking} maxLength={240} /></label>
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Update order'}</button>
      </form>
      {feedback && <p className="error" role="alert">{feedback}</p>}
    </div>
  </details>;
}

function Traffic({ data }) {
  if (!data) return null;
  const counts = [['Unique browsers · 30 days', data.visitors], ['Page and section views · 30 days', data.views], ['Browsers seen · Last 5 minutes', data.recent]];
  const days = [...data.days].reverse();
  const largest = Math.max(1, ...days.map(day => day.views));
  return <>
    <div className="metrics">{counts.map(([label, value]) => <div key={label}><strong>{Number(value || 0).toLocaleString('en-IN')}</strong><span>{label}</span></div>)}</div>
    <div className="traffic-details">
      <section><h3>Views by page or section</h3>
        {!data.pages.length ? <p className="muted">No traffic recorded yet.</p> : <table><thead><tr><th>Page or section</th><th>Views</th></tr></thead>
          <tbody>{data.pages.map(page => <tr key={page.page}><th scope="row">{page.page}</th><td>{page.views}</td></tr>)}</tbody></table>}
      </section>
      <section><h3>Daily views (India time)</h3>
        {!days.length ? <p className="muted">No traffic recorded yet.</p> : <ul className="chart">
          {days.map(day => <li key={day.day}><time dateTime={day.day}>{day.day.slice(5)}</time>
            <meter min="0" max={largest} value={day.views} aria-label={`Views on ${day.day}`} /><span>{day.views}</span></li>)}
        </ul>}
      </section>
    </div>
  </>;
}

function Admin() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('Orders');
  const [catalog, setCatalog] = useState(null);
  const [orders, setOrders] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editorError, setEditorError] = useState('');
  const currentLoad = useRef(0);

  useEffect(() => {
    request('session').then(setSession).catch(error => {
      if (error.status !== 401) setError(error.message);
      setSession(null);
    });
  }, []);

  async function load(activeTab = tab) {
    const token = ++currentLoad.current;
    setLoading(true);
    try {
      if (activeTab === 'Orders') {
        const data = await request(`orders?page=${page}&status=${encodeURIComponent(orderFilter)}`);
        if (currentLoad.current === token) setOrders(data);
      } else if (activeTab === 'Traffic') {
        const data = await request('traffic');
        if (currentLoad.current === token) setTraffic(data);
      } else {
        const data = await request('catalog');
        if (currentLoad.current === token) setCatalog(data);
      }
    } catch (error) {
      if (currentLoad.current === token) handleError(error);
    } finally {
      if (currentLoad.current === token) setLoading(false);
    }
  }

  useEffect(() => {
    if (session) load();
  }, [session, tab, page, orderFilter]);

  function handleError(error, inEditor = false) {
    if (error.status === 401) {
      setSession(null);
      setEditor(null);
      setError('Your admin session expired. Sign in again.');
    } else (inEditor ? setEditorError : setError)(error.message);
  }

  async function mutate(path, method, data, message, inEditor = false) {
    setBusy(true);
    setError('');
    setEditorError('');
    setNotice('');
    try {
      await request(path, method, data, session.csrf);
      setEditor(null);
      setNotice(message);
      await load();
    } catch (error) {
      handleError(error, inEditor);
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <main className="signin">
    <a href="/" className="brand-admin">Oak &amp; Whimsy</a>
    <h1>Shop admin</h1>
    {session === undefined ? <p role="status">Checking session…</p> : <form onSubmit={async event => {
      event.preventDefault();
      setBusy(true);
      setError('');
      try { setSession(await request('login', 'POST', fieldsOf(event.currentTarget))); }
      catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }}>
      <label>Username<input name="username" autoComplete="username" maxLength={80} required /></label>
      <label>Password<input type="password" name="password" autoComplete="current-password" maxLength={256} required /></label>
      <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
  </main>;

  const collection = tab.toLowerCase();
  const itemLabel = tab === 'Categories' ? 'category' : collection.slice(0, -1);
  const edit = item => { setEditorError(''); setEditor({ type: 'edit', item }); };
  const remove = item => { setEditorError(''); setEditor({ type: 'delete', item }); };
  const save = data => mutate(editor.item ? `${collection}/${editor.item.id}` : collection,
    editor.item ? 'PUT' : 'POST', data, `Saved ${itemLabel}.`, true);

  return <>
    <header className="admin-header"><a href="/" className="brand-admin">Oak &amp; Whimsy</a>
      <div className="row"><a href="/">View shop</a>
      <button type="button" disabled={busy} onClick={async () => {
        try {
          await request('logout', 'POST', undefined, session.csrf);
          currentLoad.current++;
          setSession(null);
          setOrders(null);
          setCatalog(null);
          setTraffic(null);
          setNotice('');
        } catch (error) { handleError(error); }
      }}>Sign out</button></div>
    </header>
    <main className="workspace">
      <h1>Shop admin</h1>
      <nav className="tabs" aria-label="Admin sections">{tabs.map(name =>
        <button type="button" key={name} aria-pressed={tab === name} onClick={() => { setNotice(''); setError(''); setTab(name); }}>{name}</button>
      )}</nav>
      <section className="workspace-panel">
        <div className="section-heading"><h2>{tab}</h2><div className="row">
          <button type="button" onClick={() => load()} disabled={loading}>Refresh</button>
          {catalog && ['Products', 'Categories', 'Offers'].includes(tab) && <button type="button" className="primary" onClick={() => edit(null)}>Add {itemLabel}</button>}
        </div></div>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {loading && <p className="muted" role="status">Refreshing {tab.toLowerCase()}…</p>}
        {tab === 'Orders' && <>
          <label className="status-filter">Filter by status<select value={orderFilter} onChange={event => { setPage(1); setOrderFilter(event.target.value); }}>
            <option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{displayStatus(status)}</option>)}
          </select></label>
          {orders && (!orders.orders.length ? <p className="state">No orders match this view.</p> : <div className="order-list">{orders.orders.map(order =>
            <OrderCard key={order.id} order={order} save={async (id, data) => {
              try { await request(`orders/${id}`, 'PATCH', data, session.csrf); }
              catch (error) { if (error.status === 401) handleError(error); throw error; }
              setNotice(`Updated order ${id}.`);
              await load();
            }} />)}</div>)}
          {orders?.total > 25 && <div className="row pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {Math.ceil(orders.total / 25)}</span>
            <button type="button" disabled={page * 25 >= orders.total} onClick={() => setPage(page + 1)}>Next</button>
          </div>}
        </>}
        {tab === 'Traffic' && <Traffic data={traffic} />}
        {catalog && ['Products', 'Categories', 'Offers'].includes(tab) && <>
          {tab === 'Offers' && <details className="offers-settings">
            <summary>Edit storefront offers section</summary>
            <form onSubmit={event => {
              event.preventDefault();
              mutate('offers-tab', 'PUT', fieldsOf(event.currentTarget), 'Saved the storefront offers section.');
            }}>
              <div className="fields">
                <label>Heading<input name="title" defaultValue={catalog.offersTab.title} maxLength={80} required /></label>
                <label>Introduction<textarea name="description" defaultValue={catalog.offersTab.description} maxLength={350} rows={2} /></label>
              </div>
              <button className="primary" disabled={busy}>Save section</button>
            </form>
          </details>}
          <CatalogTable tab={tab} items={catalog[collection]} categories={catalog.categories} edit={edit} remove={remove} />
        </>}
      </section>
    </main>
    {editor && <Modal title={editor.type === 'delete' ? `Delete ${itemLabel}` : `${editor.item ? 'Edit' : 'Add'} ${itemLabel}`}
      busy={busy} onClose={() => setEditor(null)}>
      {editorError && <p className="error" role="alert">{editorError}</p>}
      {editor.type === 'delete' ? <div>
        <p>Permanently delete “{editor.item.name || editor.item.title}”?</p>
        <button type="button" className="danger" disabled={busy}
          onClick={() => mutate(`${collection}/${editor.item.id}`, 'DELETE', undefined, `Deleted ${itemLabel}.`, true)}>
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div> : tab === 'Products' ? <ProductEditor busy={busy} item={editor.item} categories={catalog.categories} onSave={save} />
        : tab === 'Categories' ? <CategoryEditor busy={busy} item={editor.item} onSave={save} />
        : <OfferEditor busy={busy} item={editor.item} products={catalog.products} onSave={save} />}
    </Modal>}
  </>;
}

createRoot(document.getElementById('admin-root')).render(<Admin />);
