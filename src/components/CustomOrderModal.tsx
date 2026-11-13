import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { submitCustomInquiry } from '../services/api.ts';
import type { CustomOrderInquiry } from '../types.ts';

interface CustomOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({ open, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] =
    useState<CustomOrderInquiry['eventType']>('Birthday Cake');
  const [eventDate, setEventDate] = useState('');
  const [servingsOrBoxes, setServingsOrBoxes] = useState('4 lb Two-Tier / 25 Guests');
  const [flavorOrSelection, setFlavorOrSelection] = useState('Belgian Chocolate & Caramel');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    inquiry: CustomOrderInquiry;
    whatsappUrl: string;
  } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerName.trim() || !phone.trim()) {
      setError('Please enter your name and mobile number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitCustomInquiry({
        customerName: customerName.trim(),
        phone: phone.trim(),
        eventType,
        eventDate,
        servingsOrBoxes,
        flavorOrSelection,
        details,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndReset = () => {
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A12]/45 backdrop-blur-xs p-4 overflow-y-auto"
        onClick={closeAndReset}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-2xl bg-[#FFFDF9] border border-[#2C1A12]/12 shadow-2xl overflow-hidden my-auto"
        >
          <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between bg-white">
            <div>
              <h2
                className="text-xl font-bold text-[#2C1A12]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Custom Cakes &amp; Wedding Orders
              </h2>
              <p className="text-xs text-[#6B4E3D]">
                Tailored multi-tier cakes, wedding bhaji boxes &amp; corporate hampers
              </p>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              aria-label="Close custom order modal"
              className="w-9 h-9 rounded-full hover:bg-[#FAF5EB] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {result ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[#1E7E45] mx-auto" />
                <h3
                  className="text-xl font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Bespoke Inquiry Received
                </h3>
                <p className="text-sm text-[#5C4335] max-w-md mx-auto">
                  Our head pastry &amp; mithai master will review your {result.inquiry.eventType}{' '}
                  details and share design &amp; pricing confirmation.
                </p>
                <a
                  href={result.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#1E7E45] text-white text-sm font-semibold hover:bg-[#176637]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Continue Discussion on WhatsApp</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#A63A2B]/25 text-xs text-[#A63A2B]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Hira Mansoor"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Occasion Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) =>
                        setEventType(e.target.value as CustomOrderInquiry['eventType'])
                      }
                      className="w-full h-11 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    >
                      <option value="Birthday Cake">Birthday Cake</option>
                      <option value="Wedding Bhaji & Favors">Wedding Bhaji &amp; Favors</option>
                      <option value="Corporate Gift Boxes">Corporate Gift Boxes</option>
                      <option value="Custom Celebration">Custom Celebration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Weight / Box Quantity
                    </label>
                    <input
                      type="text"
                      value={servingsOrBoxes}
                      onChange={(e) => setServingsOrBoxes(e.target.value)}
                      placeholder="e.g. 5 lb cake or 50 wedding boxes"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Flavor / Mithai Selection
                    </label>
                    <input
                      type="text"
                      value={flavorOrSelection}
                      onChange={(e) => setFlavorOrSelection(e.target.value)}
                      placeholder="Pistachio Barfi, Belgian Chocolate..."
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                    Design Notes / Inscription
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Colors, theme, ribbon monogram, dietary notes, or custom inscription..."
                    className="w-full p-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D] disabled:opacity-50"
                >
                  {submitting ? 'Submitting Inquiry...' : 'Submit Custom Order Request'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
