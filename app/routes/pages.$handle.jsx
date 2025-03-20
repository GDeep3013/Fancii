import { useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';

// Meta function without useEffect
export const meta = ({ data }) => [{ title: `Hydrogen | ${data?.page?.title ?? 'Untitled'}` }];

// Load Shopify Analytics script in the Page component
function loadShopifyAnalytics() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.shopify.com/shopifycloud/shopify-analytics/assets/v1.0/shopify-analytics.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);
}

// Add to cart and checkout function
async function addToCartAndCheckout(productId, variantId) {
  alert(variantId);
  const shopifyEndpoint = 'https://htbu48-ps.myshopify.com/api/2024-10/graphql.json';
  const shopifyToken = '5620c3de24f081b6dc8328658eb56304';

  const mutation = `
    mutation CreateCart($variantId: ID!) {
      cartCreate(input: {
        lines: [
          {
            merchandiseId: $variantId,
            quantity: 1
          }
        ]
      }) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  try {
    const response = await fetch(shopifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyToken,
      },
      body: JSON.stringify({ query: mutation, variables: { variantId: `gid://shopify/ProductVariant/${variantId}` } }),
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.statusText);
      throw new Error('Failed to fetch from Shopify API');
    }
    console.log(data, errors);
    const { data, errors } = await response.json();
    if (errors || !data?.cartCreate?.cart?.checkoutUrl) {
      console.error('Error creating cart:', errors);
      alert('Failed to add to cart. Please try again.');
      return;
    }

    let checkoutUrl = data.cartCreate.cart.checkoutUrl;
    const currentParams = window.location.search;
    if (currentParams) {
      checkoutUrl += (checkoutUrl.includes('?') ? '&' : '?') + currentParams.substring(1);
    }

    if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
      window.ShopifyAnalytics.lib.track('add_to_cart', {
        currency: 'USD',
        value: 29.99,
        product_id: variantId,
        quantity: 1,
      });
    }

    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Cart API Error:', error);
    alert('Error adding item to cart.');
  }
}

// Loader function
export async function loader() {
  const productId = '10099694108983';
  const shopifyEndpoint = 'https://htbu48-ps.myshopify.com/api/2024-10/graphql.json';
  const shopifyToken = '5620c3de24f081b6dc8328658eb56304';

  const query = `
    query GetProductById($id: ID!) {
      product(id: $id) {
        id
        title
        descriptionHtml
        images(first: 10) {
          nodes {
            url
            altText
          }
        }
        variants(first: 10) {
          nodes {
            id
            title
            price {
              amount
            }
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const variables = { id: `gid://shopify/Product/${productId}` };

  try {
    const response = await fetch(shopifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product data');
    }

    const { data, errors } = await response.json();
    if (errors || !data?.product) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Product not found');
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Product not found');
  }
}

// Page Component
export default function Page() {
  loadShopifyAnalytics();
  const product = useLoaderData();

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
            <button onClick={() => addToCartAndCheckout(product.id, variant.id)}>
              Buy Now
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */