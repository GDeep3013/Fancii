import { useLoaderData } from '@remix-run/react';
import { useCart } from '@shopify/hydrogen-react';
import { useEffect } from 'react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.page?.title ?? 'Untitled'}` }];
};

const variantid = 'gid://shopify/ProductVariant/40117447884884';
export function AddToCartAndCheckout({ variantid, quantity = 1 }) {
  const { cartCreate } = useCart();

  const handleAddToCart = async () => {
    const response = await cartCreate({
      lines: [
        {
          merchandiseId: variantid,
          quantity,
        },
      ],
    });

    if (response?.cart?.checkoutUrl) {
      window.location.href = response.cart.checkoutUrl; // Redirect to checkout
    } else {
      console.error('Error adding to cart or getting checkout URL');
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Buy Now
    </button>
  );
}

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
      {product.images?.nodes?.map((image, index) => (
        <img key={index} src={image.url} alt={image.altText || product.title} />
      ))}
      <h3>Variants:</h3>
      <ul>
        {product.variants?.nodes?.map((variant) => (
          <li key={variant.id}>
            {variant.title} - ${variant.price?.amount || 'N/A'}
          </li>
        ))}
      </ul>
      <AddToCartAndCheckout variantid={variantid} />
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
