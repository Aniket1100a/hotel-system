import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Billing() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      // Orders that are served but not yet billed are ready for checkout.
      const { data } = await api.get('/orders/?status=SERVED')
      setOrders(data)
      setError('')
    } catch (err) {
      setError('Could not load orders. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const generateInvoice = async (order) => {
    setGenerating(order.id)
    try {
      await api.post('/billing/', { order: order.id, tax_percent: 5, discount_amount: 0 })
      load()
    } finally {
      setGenerating(null)
    }
  }

  if (loading) return <p>Loading orders ready for billing...</p>

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Billing</h1>
      <p style={{ color: '#6b7280' }}>Orders marked "Served" show up here, ready to be invoiced.</p>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {orders.length === 0 && <p style={{ color: '#9ca3af' }}>No orders waiting for billing.</p>}

      {orders.map((order) => (
        <div key={order.id} style={styles.card}>
          <div style={styles.rowTop}>
            <strong>Table {order.table_number}</strong>
            <span>Order #{order.id}</span>
          </div>
          <ul style={styles.itemList}>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} x {item.menu_item_name} — ₹{item.subtotal}
              </li>
            ))}
          </ul>
          <div style={styles.rowBottom}>
            <strong>Total: ₹{order.total_amount}</strong>
            <button
              style={styles.button}
              disabled={generating === order.id}
              onClick={() => generateInvoice(order)}
            >
              {generating === order.id ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: 10,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  rowTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  itemList: { margin: '8px 0', paddingLeft: 20, color: '#374151', fontSize: 14 },
  rowBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  button: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#111827',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
}
