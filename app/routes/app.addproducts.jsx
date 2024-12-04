// app/routes/app.products.new.jsx
import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  LegacyCard,
  Form,
  FormLayout,
  TextField,
  Select,
  Button,
  Text,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

const CREATE_PRODUCT_WITH_OPTIONS = `
  mutation CreateProductWithOptions($input: ProductInput!) {
    productCreate(input: $input) {
      userErrors {
        field
        message
      }
      product {
        id
        options {
          id
          name
          position
          values
          optionValues {
            id
            name
            hasVariants
          }
        }
        variants(first: 5) {
          nodes {
            id
            title
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

const ADD_PRODUCT_PRICE = `
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    product {
      id
    }
    productVariants {
      id
      metafields(first: 2) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  // Extract form values
  const title = formData.get("title");
  const descriptionHtml = formData.get("description");
  const vendor = formData.get("vendor");
  const productType = formData.get("productType");
  const price = formData.get("price");
  const inventory = formData.get("inventory");
  const status = formData.get("status");

 
const productInput = {
  title,
  descriptionHtml,
  productType,
  vendor,
  "tags":"aksdfjk,jdsflk,adsjfl",
  "metafields": [
    {
      "namespace": "my_field",
      "key": "liner_material",
      "type": "single_line_text_field",
      "value": "Synthetic Leather"
    }
  ],
  "seo": {
    "title": "seo tilt",
    "description": "seo description"
  },
  "productOptions": [
    {
      "name": "Color",
      "values": [
        {
          "name": "Red"
        },
        {
          "name": "Green"
        }
      ]
    },
    {
      "name": "Size",
      "values": [
        {
          "name": "Small"
        },
        {
          "name": "Medium"
        }
      ]
    }
  ]
}

  try {
    
    const response = await admin.graphql(CREATE_PRODUCT_WITH_OPTIONS, {
      variables: { input: productInput },
    });
  

    const rawResponse = await response.json();


    const priceInput = {
      "productId": rawResponse.data.productCreate.product.id,
      "variants": [
        {
          "id": rawResponse.data.productCreate.product.variants.nodes[0].id,
          "price": price,
          "compareAtPrice": "179.99"
        }
      ]
    } 

 
    const PriceResponse = await admin.graphql(ADD_PRODUCT_PRICE, {
      variables: { input: priceInput },
    });
  

    const rpResponse = await PriceResponse.json();


console.log("-----rpResponse--",rpResponse)

    console.log("===Step3 the id ===", rawResponse.data.productCreate.product.variants.nodes[0].id);
    
   
   // return redirect("/app/products");
  
  } catch (error) {
    console.error("Unexpected Error:", error);
  
    
    return json({
      errors: [{ message: "Failed to create product" }],
      values: Object.fromEntries(formData),
    });
  }
  
};

export default function NewProduct() {
  const actionData = useActionData();
  const submit = useSubmit();

  const [formValues, setFormValues] = useState({
    title: actionData?.values?.title || "",
    description: actionData?.values?.description || "",
    vendor: actionData?.values?.vendor || "",
    productType: actionData?.values?.productType || "",
    price: actionData?.values?.price || "",
    inventory: actionData?.values?.inventory || "",
    status: actionData?.values?.status || "DRAFT",
  });

  const handleChange = (field) => (value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Add New Product"
      backAction={{
        content: "Products",
        url: "/app/products",
      }}
    >
      <LegacyCard sectioned>
        {actionData?.errors && (
          <Banner status="critical">
            <ul>
              {actionData.errors.map((error, index) => (
                <li key={index}>
                  {error.field ? `${error.field}: ` : ""}{error.message}
                </li>
              ))}
            </ul>
          </Banner>
        )}

        <Form method="post" onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Title"
              name="title"
              type="text"
              required
              value={formValues.title}
              onChange={handleChange("title")}
              autoComplete="off"
            />

            <TextField
              label="Description"
              name="description"
              type="text"
              multiline={4}
              value={formValues.description}
              onChange={handleChange("description")}
            />

            <FormLayout.Group>
              <TextField
                label="Vendor"
                name="vendor"
                type="text"
                value={formValues.vendor}
                onChange={handleChange("vendor")}
              />

              <TextField
                label="Product Type"
                name="productType"
                type="text"
                value={formValues.productType}
                onChange={handleChange("productType")}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <TextField
                label="Price"
                name="price"
                type="number"
                step="0.01"
                prefix="$"
                required
                value={formValues.price}
                onChange={handleChange("price")}
              />
              <TextField
                label="Inventory"
                name="inventory"
                type="number"
                value={formValues.inventory}
                onChange={handleChange("inventory")}
              />
            </FormLayout.Group>

            <Select
              label="Status"
              name="status"
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Draft", value: "DRAFT" },
              ]}
              value={formValues.status}
              onChange={handleChange("status")}
            />

            <Button submit primary>
              Add Product
            </Button>
          </FormLayout>
        </Form>
      </LegacyCard>
    </Page>
  );
}
