import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  try {
    const { event, data } = await request.json();

    // Example: Send event to a logging system or external service
    console.log('Event:', event, 'Data:', data);

    // If you want to send data to Shopify via Admin API (if needed)
    const shopifyEndpoint = `https://${context.env.htbu48-ps.myshopify.com}/admin/api/2024-01/graphql.json`;
    const shopifyAccessToken = context.env.SHOPIFY_ADMIN_API_TOKEN;

    const response = await fetch(shopifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': '5620c3de24f081b6dc8328658eb56304',
      },
      body: JSON.stringify({
        query: `
          mutation PixelEvent($event: String!, $data: JSON!) {
            pixelEvent(input: {event: $event, data: $data}) {
              success
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: { event, data },
      }),
    });

    const responseData = await response.json();
    return json(responseData);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
