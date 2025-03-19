import React from 'react';
import { useLoaderData } from '@remix-run/react';
import { useShop } from '@shopify/hydrogen';

const CREATE_CART_MUTATION = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export function AddToCartAndCheckout({ variantid, quantity = 1 }) {
  const { storeDomain, storefrontToken } = useShop();

  const handleAddToCart = async () => {
    try {
      const response = await fetch(`https://${storeDomain}/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({
          query: CREATE_CART_MUTATION,
          variables: {
            input: {
              lines: [
                {
                  merchandiseId: variantid,
                  quantity,
                },
              ],
            },
          },
        }),
      });

      const result = await response.json();

      if (result?.data?.cartCreate?.cart?.checkoutUrl) {
        window.location.href = result.data.cartCreate.cart.checkoutUrl; // Redirect to checkout
      } else {
        console.error('Error:', result?.data?.cartCreate?.userErrors);
      }
    } catch (error) {
      console.error('Error creating cart:', error);
    }
  };

  return (
    <button onClick={handleAddToCart} className="bg-blue-500 text-white px-4 py-2 rounded">
      Buy Now
    </button>
  );
}

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
            <AddToCartAndCheckout variantid={variant.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}