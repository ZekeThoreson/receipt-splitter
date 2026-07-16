# Receipt Splitter

**Split the bill. Skip the hassle.**

→ **[Live app](https://receipt-splitter-ten.vercel.app)**

Scan a receipt, tap what you ordered, send the request. No mental math, no "wait, who had the filet?", no one stuck fronting $240.

---

## The problem

Splitting a check is a small task that reliably breaks the flow of a good night. Conversation stops, nobody remembers what they ordered, one person does math for the table, and half the payment requests never get sent.

The real cost isn't the money — it's the friction and the mental load, arriving at exactly the moment everyone wants the evening to end cleanly. Receipt Splitter treats bill-splitting as a UX problem instead of an arithmetic one.

## How it works

**Receipt → Assign → Pay**

1. **Scan.** The receipt image is sent to the [Veryfi OCR API](https://www.veryfi.com/), which returns parsed line items, prices, and tax. This removes the slowest and most error-prone step — manual entry.
2. **Assign.** Each person claims what they ordered. Shared dishes can be split between any subset of people.
3. **Pay.** The app computes per-person totals — items, proportional tax, and tip — and produces a clean summary to send.

## Design decisions

- **Dark UI with a high-contrast yellow accent.** Primary actions are unmissable, which reduces hesitation and mis-taps when the app is being passed around a table in a dim restaurant.
- **Item-level assignment over even splits.** Fairness was a core requirement: you pay for what you ordered.
- **Speed over features.** The tool has to be faster than the argument it replaces. Anything that didn't serve that (accounts, logins, setup) was cut from v1.

## Stack

- **Frontend:** JavaScript, [React / Next.js — CONFIRM]
- **Styling:** [Tailwind / CSS modules / plain CSS — CONFIRM]
- **OCR:** Veryfi API for receipt parsing
- **Hosting:** Vercel

## Running locally

```bash
git clone https://github.com/ZekeThoreson/receipt-splitter.git
cd receipt-splitter
npm install
```

Create a `.env.local` file with your Veryfi credentials:

```
VERYFI_CLIENT_ID=your_client_id
VERYFI_API_KEY=your_api_key
VERYFI_USERNAME=your_username
```

```bash
npm run dev
```

## Validation

Validated through real-world use rather than scale: friends used it for coffee runs and group dinners and reported that it saved time and reduced the awkwardness. The core interaction held up in the exact context it was designed for.

## What's next

- User accounts and saved payment methods
- Direct integration with a payment provider so requests settle in-app
- Receipt history

---

Built for Product Development Studio at CU Boulder's ATLAS Institute by [Zeke Thoreson](https://zekethoreson.com).
