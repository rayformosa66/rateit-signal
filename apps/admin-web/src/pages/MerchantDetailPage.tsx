import { Link, useParams } from 'react-router-dom';
import { MOCK_MERCHANTS } from '../data/merchants';

function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();

  // "new" is the Create Merchant route
  if (id === 'new') {
    return (
      <>
        <Link to="/merchants" className="back-link">← Back to Merchants</Link>
        <div className="detail-card">
          <h2>Create Merchant</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FieldInput label="Name" id="name" placeholder="e.g. ShopTrusted" />
            <FieldInput label="Domain" id="domain" placeholder="e.g. shoptrusted.com.au" />
            <FieldInput label="Category" id="category" placeholder="e.g. General Retail" />
            <div className="detail-actions">
              <button type="submit" className="btn btn-primary">Save Merchant</button>
              <Link to="/merchants" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </>
    );
  }

  const merchant = MOCK_MERCHANTS.find((m) => m.id === id);

  if (!merchant) {
    return (
      <>
        <Link to="/merchants" className="back-link">← Back to Merchants</Link>
        <p>Merchant not found.</p>
      </>
    );
  }

  return (
    <>
      <Link to="/merchants" className="back-link">← Back to Merchants</Link>
      <div className="detail-card">
        <h2>{merchant.name}</h2>

        <div className="field-row">
          <span className="field-label">Domain</span>
          <span className="field-value">{merchant.domain}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Category</span>
          <span className="field-value">{merchant.category}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Verdict</span>
          <span className="field-value">{merchant.currentVerdict}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Last Reviewed</span>
          <span className="field-value">
            {new Date(merchant.lastReviewedAt).toLocaleDateString('en-AU', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="field-row">
          <span className="field-label">Status</span>
          <span className="field-value">{merchant.status}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Public Summary</span>
          <span className="field-value">{merchant.publicSummary}</span>
        </div>

        <div className="detail-actions">
          <button className="btn btn-primary">Edit Merchant</button>
          <Link to="/merchants" className="btn btn-secondary">Back</Link>
        </div>
      </div>
    </>
  );
}

function FieldInput({
  label,
  id,
  placeholder,
}: {
  label: string;
  id: string;
  placeholder?: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}

export default MerchantDetailPage;
