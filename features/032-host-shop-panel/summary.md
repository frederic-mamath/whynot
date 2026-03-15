# Feature 032 — Host Shop Panel

## Progress

| User Story                                                                                                                                   | Status  |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| As a seller host, in the live details page, I can tap "My shop" in the VerticalControlPanel to open a side panel with all my shop's products | planned |
| As a seller host, in the shop panel, I can see which products are already linked to the live (pre-checked)                                   | planned |
| As a seller host, in the shop panel, I can select/deselect products and confirm to associate or remove them from the live                    | planned |
| As a developer, the product list UI is extracted into a shared ProductListSection component reused in SellerLivesPage and ShopPanel          | planned |

## Initial Prompt

> As a seller and host of a live, in the live details page, I would like to see a new button `My shop` in the VerticalControlPanel to show the full list of products from the seller's shop.
>
> You will extract the ProductsSection into a common ProductListSection in the `src/components/ProductListSection`.
>
> When I click on the My shop button, it will open a side panel that will show the ProductListSection. It should allow to associate any products from the host's shop.
>
> When starting the implementation, you will create the documentation based on features/ARCHITECTURE.md.
>
> After the implementation, you will build the app to verify that there is no errors. If there are errors, you will fix them and try again until there is no errors.
