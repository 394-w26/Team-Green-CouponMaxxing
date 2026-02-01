import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import type { Coupon } from './types';

interface AddCouponFormProps {
  onClose: () => void;
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'status'>, shareGlobally: boolean) => void;
}

export default function AddCouponForm({ onClose, onAddCoupon }: AddCouponFormProps) {
  const [store, setStore] = useState('');
  const [discount, setDiscount] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [category, setCategory] = useState('');
  const [shareGlobally, setShareGlobally] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseCouponText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Simple heuristics for parsing
    let parsedStore = '';
    let parsedDiscount = '';
    let parsedExpiration = '';
    let parsedCategory = '';

    // Common store names to look for
    const commonStores = ['CVS', 'Walgreens', 'Target', 'Walmart', 'Amazon', 'Best Buy', 'Home Depot', 'Lowes', 'Starbucks', 'McDonald\'s', 'Subway', 'Pizza Hut', 'Domino\'s', 'Chipotle', 'Taco Bell'];

    // First, search for known store names in the entire text
    const fullText = text.toUpperCase();
    for (const store of commonStores) {
      if (fullText.includes(store.toUpperCase())) {
        parsedStore = store;
        break;
      }
    }

    // If no known store found, look for store name patterns
    if (!parsedStore) {
      // Look for lines that might be store names (short, capitalized, no numbers)
      for (const line of lines) {
        if (line.length > 2 && line.length < 30 && !/\d/.test(line) && /^[A-Z\s&'-]+$/.test(line)) {
          // Check if it looks like a store name
          if (!line.toLowerCase().includes('off') && !line.toLowerCase().includes('save') && !line.toLowerCase().includes('coupon')) {
            parsedStore = line;
            break;
          }
        }
      }
    }

    // Fallback: look for "from"/"at" patterns
    if (!parsedStore) {
      for (const line of lines) {
        if (line.toLowerCase().includes('from') || line.toLowerCase().includes('at')) {
          const parts = line.split(/\s+/);
          const index = parts.findIndex(p => p.toLowerCase() === 'from' || p.toLowerCase() === 'at');
          if (index !== -1 && index + 1 < parts.length) {
            parsedStore = parts.slice(index + 1).join(' ');
            break;
          }
        }
      }
    }

    // Last resort: first line
    if (!parsedStore && lines.length > 0) {
      parsedStore = lines[0];
    }

    // Look for discount patterns
    const discountPatterns = [
      /(\$?\d+(?:\.\d{2})?\s*(?:off|% off|save|discount))/i,
      /(save\s*\$?\d+(?:\.\d{2})?)/i,
      /(\d+%\s*off)/i,
      /(buy\s*one\s*get\s*one)/i,
      /(bogo)/i,
      /(free\s*shipping)/i
    ];
    
    for (const line of lines) {
      for (const pattern of discountPatterns) {
        const match = line.match(pattern);
        if (match) {
          parsedDiscount = match[0];
          break;
        }
      }
      if (parsedDiscount) break;
    }

    // Look for expiration date
    const datePatterns = [
      /(?:expires?|exp|valid through?|until|exp\.)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(?:expires?|exp|valid through?|until|exp\.)\s*(\d{4}-\d{2}-\d{2})/i,
      /(?:expires?|exp|valid through?|until|exp\.)\s*(\w+ \d{1,2},? \d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:exp|expiration)/i,
      /(\d{4}-\d{2}-\d{2})\s*(?:exp|expiration)/i
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[1];
          // Try to parse and format as YYYY-MM-DD
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            parsedExpiration = parsedDate.toISOString().split('T')[0];
            break;
          }
        }
      }
      if (parsedExpiration) break;
    }

    // Infer category from store or discount
    const storeLower = parsedStore.toLowerCase();
    if (storeLower.includes('food') || storeLower.includes('pizza') || storeLower.includes('restaurant') || storeLower.includes('mcdonald') || storeLower.includes('subway') || storeLower.includes('chipotle') || storeLower.includes('taco bell') || storeLower.includes('domino')) {
      parsedCategory = 'Food';
    } else if (storeLower.includes('pharmacy') || storeLower.includes('cvs') || storeLower.includes('walgreens')) {
      parsedCategory = 'Pharmacy';
    } else if (storeLower.includes('target') || storeLower.includes('walmart') || storeLower.includes('best buy') || storeLower.includes('home depot') || storeLower.includes('lowes')) {
      parsedCategory = 'Retail';
    } else if (storeLower.includes('movie') || storeLower.includes('entertainment') || storeLower.includes('starbucks')) {
      parsedCategory = 'Entertainment';
    }

    return { store: parsedStore, discount: parsedDiscount, expirationDate: parsedExpiration, category: parsedCategory };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setIsProcessing(true);

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseCouponText(text);
      
      console.log('Extracted text:', text);
      console.log('Parsed data:', parsed);
      
      if (parsed.store) setStore(parsed.store);
      if (parsed.discount) setDiscount(parsed.discount);
      if (parsed.expirationDate) setExpirationDate(parsed.expirationDate);
      if (parsed.category) setCategory(parsed.category);
      
      // If store wasn't found but text was extracted, show the text for debugging
      if (!parsed.store && text.trim()) {
        alert(`OCR extracted text but couldn't identify store. Extracted text:\n\n${text}\n\nPlease fill in the store name manually.`);
      }
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to process the image. Please fill in the details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store || !discount || !expirationDate) {
      alert('Please fill in all required fields');
      return;
    }

    onAddCoupon(
      {
        store,
        discount,
        expirationDate,
        category: category || undefined,
      },
      shareGlobally
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-display text-slate-900">Add New Coupon</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="image" className="block text-sm font-semibold text-slate-700 mb-1">
              Upload Coupon Image (Optional)
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isProcessing}
            />
            {isProcessing && <p className="text-sm text-emerald-600 mt-1">Processing image...</p>}
          </div>

          <div>
            <label htmlFor="store" className="block text-sm font-semibold text-slate-700 mb-1">
              Store Name *
            </label>
            <input
              type="text"
              id="store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Target, CVS, Pizza Hut"
              required
            />
          </div>

          <div>
            <label htmlFor="discount" className="block text-sm font-semibold text-slate-700 mb-1">
              Discount Details *
            </label>
            <input
              type="text"
              id="discount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., $10 Off $50 Purchase"
              required
            />
          </div>

          <div>
            <label htmlFor="expirationDate" className="block text-sm font-semibold text-slate-700 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              id="expirationDate"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">Select a category</option>
              <option value="Food">Food</option>
              <option value="Retail">Retail</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={shareGlobally}
              onChange={(e) => setShareGlobally(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Share to global catalog so others can see it
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Add Coupon
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
