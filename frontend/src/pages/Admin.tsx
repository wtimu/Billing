import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { adminLogin, fetchAdminOrders, fetchPackages, createPackage, updatePackage, deletePackage, type OrderResponse, type Package } from '../lib/api';
import { formatCurrency } from '../lib/format';

type FilterState = {
  status: string;
  provider: string;
  from: string;
  to: string;
};

const defaultFilters: FilterState = {
  status: '',
  provider: '',
  from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  to: dayjs().format('YYYY-MM-DD')
};

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-200 text-slate-600'
};

const loadToken = () => localStorage.getItem('adminToken');

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    priceUgx: '',
    durationMinutes: '',
    dataMb: ''
  });

  const fetchOrders = async (authToken: string, params: FilterState) => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders(authToken, params);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackagesData = async () => {
    try {
      const data = await fetchPackages();
      setPackages(data);
    } catch (err) {
      setError('Failed to load packages');
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOrders(token, filters);
    fetchPackagesData();
  }, [token, filters]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await adminLogin(email, password);
      localStorage.setItem('adminToken', response.token);
      setToken(response.token);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setOrders([]);
  };

  const totals = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.amountUgx, 0);
    const paid = orders.filter((order) => order.status === 'PAID').length;
    return { total, paid, count: orders.length };
  }, [orders]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-slate-900">Admin Login</h1>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Manage packages and monitor orders.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto mt-6 max-w-6xl space-y-6">
        {/* Package Management */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Package Management</h2>
            <button
              onClick={() => {
                setEditingPackage(null);
                setPackageForm({ name: '', priceUgx: '', durationMinutes: '', dataMb: '' });
                setShowPackageForm(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Package
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-600">{formatCurrency(pkg.priceUgx)}</p>
                <p className="text-xs text-gray-500">
                  {pkg.durationMinutes ? `${pkg.durationMinutes} min` : 'Unlimited'}
                  {pkg.dataMb && ` • ${pkg.dataMb}MB`}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPackage(pkg);
                      setPackageForm({
                        name: pkg.name,
                        priceUgx: pkg.priceUgx.toString(),
                        durationMinutes: pkg.durationMinutes?.toString() || '',
                        dataMb: pkg.dataMb?.toString() || ''
                      });
                      setShowPackageForm(true);
                    }}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this package?')) {
                        try {
                          await deletePackage(token, pkg.id);
                          fetchPackagesData();
                        } catch (err) {
                          setError('Failed to delete package');
                        }
                      }
                    }}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {showPackageForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  {editingPackage ? 'Edit Package' : 'Add Package'}
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const data = {
                        name: packageForm.name,
                        priceUgx: parseInt(packageForm.priceUgx),
                        durationMinutes: packageForm.durationMinutes ? parseInt(packageForm.durationMinutes) : null,
                        dataMb: packageForm.dataMb ? parseInt(packageForm.dataMb) : null
                      };
                      
                      if (editingPackage) {
                        await updatePackage(token, editingPackage.id, data);
                      } else {
                        await createPackage(token, data);
                      }
                      
                      setShowPackageForm(false);
                      fetchPackagesData();
                    } catch (err) {
                      setError('Failed to save package');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
                    <input
                      type="number"
                      value={packageForm.priceUgx}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, priceUgx: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={packageForm.durationMinutes}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data (MB)</label>
                    <input
                      type="number"
                      value={packageForm.dataMb}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, dataMb: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                    >
                      {editingPackage ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPackageForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Orders</p>
              <p className="text-2xl font-semibold text-slate-900">{totals.count}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Paid</p>
              <p className="text-2xl font-semibold text-slate-900">{totals.paid}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Volume</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">Provider</label>
              <select
                value={filters.provider}
                onChange={(event) => setFilters((prev) => ({ ...prev, provider: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="MTN">MTN</option>
                <option value="AIRTEL">Airtel</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => fetchOrders(token, filters)}
                className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Refresh
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">MSISDN</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Package</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Provider</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{order.id}</td>
                    <td className="px-4 py-2 text-slate-700">{order.msisdn}</td>
                    <td className="px-4 py-2 text-slate-700">{order.package.name}</td>
                    <td className="px-4 py-2 text-slate-900">{formatCurrency(order.amountUgx)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? 'bg-slate-200 text-slate-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{order.provider}</td>
                    <td className="px-4 py-2 text-slate-700">{order.voucherCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
          {error && <p className="p-4 text-sm text-red-500">{error}</p>}
          {!loading && orders.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No orders found for the selected filters.</p>
          )}
        </section>
      </main>
    </div>
  );
}
