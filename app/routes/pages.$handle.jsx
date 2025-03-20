import { useLoaderData } from '@remix-run/react';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.page?.title ?? 'Untitled'}` }];
};

async function addToCartAndCheckout(productId, variantId, price) {
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
      body: JSON.stringify({ query: mutation, variables: { variantId } }),
    });

    const { data, errors } = await response.json();
    if (errors || !data?.cartCreate?.cart?.checkoutUrl) {
      console.error('Error creating cart:', errors);
      alert('Failed to add to cart. Please try again.');
      return;
    }

    // Shopify Analytics Tracking
    if (data?.cartCreate?.cart?.id) {
      window.Shopify = window.Shopify || {};
      window.Shopify.analytics = window.Shopify.analytics || {};

      window.Shopify.analytics.publish('cart_add', {
        currency: 'USD',
        value: parseFloat(price || '0'),
        items: [
          {
            product_id: productId,
            variant_id: variantId,
            quantity: 1,
          },
        ],
      });

      console.log('Add to Cart event tracked');
    }

    const currentParams = window.location.search;
    let checkoutUrl = data.cartCreate.cart.checkoutUrl;
    if (currentParams) {
      checkoutUrl += (checkoutUrl.includes('?') ? '&' : '?') + currentParams.substring(1);
    }

    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Cart API Error:', error);
    alert('Error adding item to cart.');
  }
}

export default function Page() {
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
            <button
              onClick={() => addToCartAndCheckout(product.id, variant.id, variant.price?.amount)}
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


/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */