import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetchPackages, createOrder, type Package } from '../lib/api';
import { PackageCard } from '../components/PackageCard';
import { PackageDropdown } from '../components/PackageDropdown';
import { ProviderSelector } from '../components/ProviderSelector';
import { PhoneInput } from '../components/PhoneInput';
import { useOrderPolling } from '../hooks/useOrderPolling';

const validateMsisdn = (value: string) => /^(?:7\d{8})$/.test(value);

const formatMsisdn = (value: string) => `0${value}`;

const fetcher = () => fetchPackages();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12 text-slate-500">
    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="4" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeWidth="4" />
    </svg>
    Loading packages…
  </div>
);

const SuccessState = ({ voucher }: { voucher: string }) => (
  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center">
    <h3 className="text-lg font-semibold text-emerald-700">Payment confirmed!</h3>
    <p className="mt-2 text-sm text-emerald-600">Your voucher code has also been sent via SMS.</p>
    <div className="mt-4 text-3xl font-bold text-emerald-700">{voucher}</div>
  </div>
);

export default function HomePage() {
  const { data: packages, error, isLoading } = useSWR<Package[]>('packages', fetcher);
  const [selected, setSelected] = useState<Package | null>(null);
  const [provider, setProvider] = useState<'MTN' | 'AIRTEL' | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { order, isDone } = useOrderPolling(orderId, Boolean(orderId));

  const voucher = order?.voucherCode ?? null;

  const canSubmit = useMemo(() => selected && provider && validateMsisdn(phone), [selected, provider, phone]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !provider) return;
    if (!validateMsisdn(phone)) {
      setPhoneError('Enter a valid Ugandan number starting with 7');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        packageId: selected.id,
        provider,
        msisdn: formatMsisdn(phone)
      };
      const response = await createOrder(payload);
      setOrderId(response.orderId);
      setUiMessage(response.uiMessage);
      setPhoneError(null);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-gradient-to-r from-blue-600 to-green-600 shadow-lg">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">WiFi Connect Uganda</h1>
              <p className="mt-1 text-blue-100">
                Fast, reliable internet access • Pay with Mobile Money
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 lg:flex-row">
        <section className="w-full lg:w-2/3">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800">Choose Your Package</h2>
            <p className="mt-2 text-gray-600">Select the perfect internet package for your needs</p>
            
            {isLoading && <LoadingSpinner />}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-red-600">⚠️ Failed to load packages. Please retry.</p>
              </div>
            )}
            
            <div className="mt-6">
              <PackageDropdown 
                packages={packages || []} 
                selected={selected} 
                onSelect={setSelected}
                loading={isLoading}
              />
            </div>
            
            {/* Promotional Banner */}
            <div className="mt-6 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 p-4 text-white">
              <h3 className="font-bold">🎉 Special Offer!</h3>
              <p className="text-sm">Get 20% extra data on all daily packages this week!</p>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <PhoneInput value={phone} onChange={setPhone} error={phoneError} />
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Choose provider</span>
                <ProviderSelector value={provider} onChange={setProvider} />
              </div>
              <button
                type="submit"
                disabled={!canSubmit || creating}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {creating ? 'Sending prompt…' : 'Pay & Generate Voucher'}
              </button>
              {uiMessage && <p className="text-sm text-slate-500">{uiMessage}</p>}
            </form>

            {order && (
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p>Status: <span className="font-semibold">{order.status}</span></p>
                  <p>Package: {order.package.name}</p>
                </div>
                {order.status === 'PAID' && voucher && <SuccessState voucher={voucher} />}
                {order.status === 'FAILED' && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Payment failed. Please retry or contact support.
                  </p>
                )}
                {!isDone && !voucher && (
                  <p className="text-sm text-slate-500">Waiting for payment confirmation…</p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
