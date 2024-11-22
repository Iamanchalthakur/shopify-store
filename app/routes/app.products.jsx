
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  LegacyCard,
  DataTable,
  Thumbnail,
  Badge,
  Text,
  Box
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";


const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          status
          totalInventory
        }
      }
    }
  }
`;


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    
    const response = await admin.graphql(
      PRODUCTS_QUERY,
      {
        variables: {
          first: 50 
        },
      }
    );

    const data = await response.json();
    
  
    return json({
      products: data.data.products.edges
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return json({ 
      products: [],
      error: "Failed to fetch products"
    });
  }
};

export default function Products() {
  
  const { products, error } = useLoaderData();

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  const rows = products.map(({ node: product }) => {
    const firstImage = product.images.edges[0]?.node;
    const price = product.priceRangeV2.minVariantPrice.amount;
    const currencyCode = product.priceRangeV2.minVariantPrice.currencyCode;
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price);

    return [
      <Box padding="2">
        <Thumbnail
          source={firstImage?.url || ''}
          alt={firstImage?.altText || product.title}
          size="small"
        />
      </Box>,
      <Box padding="2">
        <Text variant="bodyMd" fontWeight="bold">
          {product.title}
        </Text>
        <Text variant="bodyMd" color="subdued">

       {(product.description || 'No description available').slice(0, 20)}
        </Text>
      </Box>,
      <Text variant="bodyMd">{formattedPrice}</Text>,
      <Badge
        status={product.status === 'ACTIVE' ? 'success' : 'attention'}
      >
        {product.status.toLowerCase()}
      </Badge>,
      <Text variant="bodyMd">{product.totalInventory}</Text>
    ];
  });

  return (
    <Page title="Products">
      <LegacyCard>
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'numeric',
            'text',
            'numeric',
          ]}
          headings={[
            'Image',
            'Product Details',
            'Price',
            'Status',
            'Inventory'
          ]}
          rows={rows}
          hoverable
        />
      </LegacyCard>
    </Page>
  );
}