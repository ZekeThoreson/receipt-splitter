// src/components/SummaryView.jsx
import { ChevronDown, ChevronUp, Share2 } from 'lucide-react';

// DESIGN TOKENS – keep in sync with App.jsx if you change the theme there
const COLORS = {
  background: '#0A0A0A',      // Main background
  textBody: '#EDEDED',        // Soft white body text
  textHeading: '#FFFFFF',     // Pure white headings
  accentPrimary: '#FDF701',   // Highlighter yellow – primary
  accentHover: '#EDE700',     // Slightly darker yellow – hover / secondary
  borderMuted: '#A6A6A6',     // Grey for borders / dividers
  danger: '#FF4A4A',          // Destructive actions
};

// Button + motion helpers
const primaryButtonClasses =
  // Animation timing – adjust duration here
  'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold transition-colors duration-150';

const subtleButtonClasses =
  // Animation timing – adjust duration here
  'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold border transition-colors duration-150';

export default function SummaryView({
  items,
  tax,
  tip,
  sortedPeople,
  expandedPeople,
  calculateTotals,
  onToggleExpanded,
  onSharePersonTotal,
  onBack,
  onShareTotals,
  onStartNewReceipt,
}) {
  const totals = calculateTotals();

  const itemsSubtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = parseFloat(tax || 0) || 0;
  const tipAmount = parseFloat(tip || 0) || 0;
  const grandTotal = itemsSubtotal + taxAmount + tipAmount;

//   {/* Venmo Username Error Modal */}
//         {showVenmoError && (
//           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
//             <div
//               className="rounded-md p-6 max-w-sm w-full"
//               style={{
//                 backgroundColor: COLORS.background,
//                 border: `0.5px solid ${COLORS.accentPrimary}`,
//               }}
//             >
//               <div className="flex items-center gap-3 mb-4">
//                 <AlertCircle
//                   size={32}
//                   style={{ color: COLORS.danger }}
//                 />
//                 <h2
//                   className="text-xl font-bold"
//                   style={{ color: COLORS.textHeading }}
//                 >
//                   Venmo Username Required
//                 </h2>
//               </div>

//               <p
//                 className="mb-4 text-sm"
//                 style={{ color: COLORS.textBody }}
//               >
//                 Please enter your Venmo username to share payment
//                 requests.
//               </p>

//               <input
//                 type="text"
//                 placeholder="Your Venmo username"
//                 value={venmoUsername}
//                 onChange={(e) => handleVenmoUsernameChange(e.target.value)}
//                 className="w-full px-3 py-2 rounded-md text-sm mb-4 focus:outline-none"
//                 style={{
//                   backgroundColor: '#111111',
//                   border: `1px solid ${COLORS.borderMuted}`,
//                   color: COLORS.textBody,
//                 }}
//               />

//               <button
//                 onClick={() => setShowVenmoError(false)}
//                 className={primaryButtonClasses + ' w-full py-2 px-4'}
//                 style={{
//                   backgroundColor: COLORS.accentPrimary,
//                   color: '#000000',
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.backgroundColor = COLORS.accentHover;
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
//                 }}
//               >
//                 Done
//               </button>
//             </div>
//           </div>
//         )}

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: COLORS.textHeading }}
        >
          Summary
        </h1>

        {/* Overall totals card */}
        <div
          className="mb-6 rounded-md p-4"
          style={{
            border: `.5px solid ${COLORS.accentPrimary}`,
            backgroundColor: COLORS.background,
          }}
        >
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: COLORS.textBody }}
          >
            Receipt Total:{' '}
            <span style={{ color: COLORS.accentPrimary }}>
              ${grandTotal.toFixed(2)}
            </span>
          </p>
          <p
            className="text-sm"
            style={{ color: COLORS.textBody, opacity: 0.8 }}
          >
            Items: ${itemsSubtotal.toFixed(2)} • Tax: ${taxAmount.toFixed(2)} •
            {' '}Tip: ${tipAmount.toFixed(2)}
          </p>
        </div>

        {/* People breakdown – one column */}
        <div className="space-y-3 mb-6">
          {sortedPeople.map((person) => {
            const total = totals[person.id];
            const isExpanded = expandedPeople[person.id];

            if (!total) return null;

            return (
              <div
                key={person.id}
                className="border rounded-md overflow-hidden"
                style={{
                  borderColor: COLORS.borderMuted,
                  backgroundColor: COLORS.background,
                }}
              >
                {/* Person header row */}
                <div className="w-full p-4 flex items-center justify-between">
                  <span
                    className="font-semibold"
                    style={{ color: COLORS.textBody }}
                  >
                    {total.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-lg font-bold"
                      style={{ color: COLORS.accentPrimary }} // totals in yellow
                    >
                      ${total.total.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onSharePersonTotal(person, total.total)}
                      className="p-2 rounded-md transition-colors duration-150"
                      style={{
                        color: COLORS.accentPrimary,
                      }}
                      title="Share payment request"
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      onClick={() => onToggleExpanded(person.id)}
                      className="p-2 rounded-md transition-colors duration-150"
                      style={{
                        color: COLORS.textBody,
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded person details */}
                {isExpanded && (
                  <div
                    className="p-4 border-t"
                    style={{
                      borderColor: `${COLORS.borderMuted}40`,
                      backgroundColor: COLORS.background,
                    }}
                  >
                    {/* Items for this person */}
                    <div className="space-y-2 mb-3">
                      <p
                        className="font-semibold mb-2"
                        style={{ color: COLORS.textBody }}
                      >
                        Items:
                      </p>
                      {total.claimedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm pl-4 py-1"
                          style={{
                            borderBottom:
                              idx === total.claimedItems.length - 1
                                ? 'none'
                                : `1px solid ${COLORS.borderMuted}40`,
                          }}
                        >
                          <span
                            style={{ color: COLORS.textBody, opacity: 0.8 }}
                          >
                            {item.name}{' '}
                            {item.isShared &&
                              `(split ${item.sharedWith} ways)`}
                          </span>
                          <span
                            style={{ color: COLORS.textBody }}
                          >
                            ${item.cost.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal / tax / tip / total */}
                    <div
                      className="space-y-1 pt-3"
                      style={{
                        borderTop: `1px solid ${COLORS.borderMuted}40`,
                      }}
                    >
                      <div className="flex justify-between text-sm">
                        <span style={{ color: COLORS.textBody, opacity: 0.75 }}>
                          Subtotal:
                        </span>
                        <span style={{ color: COLORS.textBody }}>
                          ${total.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: COLORS.textBody, opacity: 0.75 }}>
                          Tax:
                        </span>
                        <span style={{ color: COLORS.textBody }}>
                          ${total.tax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: COLORS.textBody, opacity: 0.75 }}>
                          Tip:
                        </span>
                        <span style={{ color: COLORS.textBody }}>
                          ${total.tip.toFixed(2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between font-semibold pt-2 border-t"
                        style={{ borderColor: `${COLORS.borderMuted}40` }}
                      >
                        <span style={{ color: COLORS.textBody }}>
                          Total:
                        </span>
                        <span style={{ color: COLORS.accentPrimary }}>
                          ${total.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className={subtleButtonClasses + ' flex-1 py-3 px-4'}
            style={{
              backgroundColor: 'transparent',
              color: COLORS.textBody,
              borderColor: COLORS.borderMuted,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.accentPrimary;
              e.currentTarget.style.color = COLORS.accentPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderMuted;
              e.currentTarget.style.color = COLORS.textBody;
            }}
          >
            Back
          </button>
          {/* <button
            onClick={onShareTotals}
            className={primaryButtonClasses + ' flex-1 py-3 px-4'}
            style={{
              backgroundColor: COLORS.accentPrimary,
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
            }}
          >
            Share Totals
          </button> */}
          <button
            onClick={onStartNewReceipt}
            className={primaryButtonClasses + ' flex-1 py-3 px-4'}
            style={{
              backgroundColor: COLORS.accentPrimary,
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
            }}
          >
            New Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
