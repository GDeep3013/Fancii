import React, { useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';

export default function Page() {
  const product = useLoaderData();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.shopify.com/shopifycloud/shopify-analytics/assets/v1.0/shopify-analytics.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
  
  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div>
      <h1>{product.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      <h3>Variants:</h3>
      <ul>
        {product.variants?.nodes?.map((variant) => (
          <div key={variant.id} style={{ marginBottom: '20px' }}>
            <h3>{variant.title} - ${variant.price?.amount || 'N/A'}</h3>
            {variant.image ? (
              <img src={variant.image.url} alt={variant.image.altText || variant.title} width="200" />
            ) : (
              <p>No Image Available</p>
            )}
            <button
              onClick={() => addToCartAndCheckout(product.id, variant.id)}
              style={{ marginLeft: '10px' }}
            >
              Buy Now
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
}
