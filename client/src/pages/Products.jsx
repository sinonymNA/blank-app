import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getPlatforms, getQueueCount, deleteProduct } from '../lib/api';
import TopBar from '../components/layout/TopBar';
import ProductCard from '../components/products/ProductCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [platforms, setPlatforms] = useState({});
  const [queueCounts, setQueueCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const prods = await getProducts();
        setProducts(prods);

        const [counts, ...platArrays] = await Promise.all([
          getQueueCount(),
          ...prods.map(p => getPlatforms(p.id))
        ]);

        setQueueCounts(counts);
        const platMap = {};
        prods.forEach((p, i) => { platMap[p.id] = platArrays[i]; });
        setPlatforms(platMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-full">
      <TopBar
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''}`}
        action={<Button onClick={() => navigate('/products/new')}>+ Add Product</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="⬡"
          title="No products yet"
          description="Add your first product and Ampere will start generating content automatically."
          action={() => navigate('/products/new')}
          actionLabel="Add Product"
        />
      ) : (
        <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              queueCount={queueCounts[p.id] || {}}
              platforms={platforms[p.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
