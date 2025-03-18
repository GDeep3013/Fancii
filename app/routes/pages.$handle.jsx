import {useLoaderData} from '@remix-run/react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const productId = "10099694108983"; // Assuming productId is passed in the URL
  const shopifyEndpoint = "https://htbu48-ps.myshopify.com/api/2024-10/graphql.json";
  const shopifyToken = "5620c3de24f081b6dc8328658eb56304";

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
    if (errors) {
      console.error("GraphQL Errors:", errors);
      throw new Error("Product not found");
    }

    return json(data.product);
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Product not found");
  }

  // Start fetching non-critical data without blocking time to first byte
  // const deferredData = loadDeferredData(args);

  // // Await the critical data required to render initial state of the page
  // const criticalData = await loadCriticalData(args);


  // return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, params}) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }
  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  

  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Page() {
  /** @type {LoaderReturnData} */

  const product = useLoaderData();

  return (
    <div>
      <h1>{product.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      {product.images?.nodes.map((image, index) => (
        <img key={index} src={image.url} alt={image.altText || product.title} />
      ))}
      <h3>Variants:</h3>
      <ul>
        {product.variants.nodes.map((variant) => (
          <li key={variant.id}>
            {variant.title} - ${variant.price.amount}
          </li>
        ))}
      </ul>
    </div>
  );

  // const {page} = useLoaderData();

  // return (
  //   <div className="page">
  //     <header>
  //       <h1>{page.title}</h1>
  //     </header>
  //     <main dangerouslySetInnerHTML={{__html: page.body}} />
  //   </div>
  // );
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
    variants(first:10) {
      nodes {
        id
        title
        sku
        price{
          amount
        }
        quantityAvailable
        image{
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
