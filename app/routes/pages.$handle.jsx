import { useLoaderData } from '@remix-run/react';
import { json } from '@shopify/remix-oxygen';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.page?.title ?? 'Untitled'}` }];
};

async function trackAddToCart(variantId, value = 29.99, quantity = 1) { 
  try {
    const response = await fetch('/apps/your-app-name/pixels/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'add_to_cart',
        data: {
          currency: 'USD',
          value,
          product_id: `gid://shopify/ProductVariant/${variantId}`,
          quantity,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Tracking failed');
    }

    console.log('Add to Cart event tracked');
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

async function addToCartAndCheckout(productId, variantId) {
  trackAddToCart(variantId, 29.99);
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
    const currentParams = window.location.search;

    // Append parameters to checkout URL
    let checkoutUrl = data.cartCreate.cart.checkoutUrl;
    if (currentParams) {
      checkoutUrl += (checkoutUrl.includes('?') ? '&' : '?') + currentParams.substring(1);
    }
console.log(checkoutUrl);

  

    // Redirect to checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Cart API Error:', error);
    alert('Error adding item to cart.');
  }
}



/**
 * @param {LoaderFunctionArgs} args
 */


export async function loader(args) {
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
    <li>   
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
      </li> 
    </ul>
  </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
`;

const GetProduct = `#graphql 
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    title
    variants(first: 10) {
      nodes {
        id
        title
        sku
        price {
          amount
        }
        quantityAvailable
        image {
          url
          originalSrc
        }
      }
    }
    collections(first: 10) {
      nodes {
        id
        title
      }
    }
  }
}`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */