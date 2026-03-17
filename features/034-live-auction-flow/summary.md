# Feature 034 — Live Auction Flow

## Progress

| User Story                                                                                                                                                                 | Status |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| As a seller/host, in the live details page, when there is no highlighted product, I see "Choisir un produit à mettre en avant" which scrolls to the "Boutique du live" tab | done   |
| As a seller/host, in the live details page, when there is a highlighted product and no active auction, I see "Commencer les enchères" which opens AuctionConfigModal       | done   |
| As a seller/host, in the live details page, when an auction is active and has a winner, I see "Vendre à <winner_nickname>" which closes/sells the auction                  | done   |
| As a seller/host, in the live details page, when an auction is active but has no bidder, I see "Annuler l'enchère" which cancels the auction                               | done   |
| As a buyer, in the live details page, the buttons "Acheter tout de suite", "+5€" and "+10€" are disabled when no auction is active                                         | done   |
| As a buyer, in the live details page, when an auction is active, "+5€" bids currentBid + 5 and "+10€" bids currentBid + 10                                                 | done   |
| As a buyer, in the live details page, when an auction is active, "Acheter tout de suite" triggers buyout if a buyout price is set                                          | done   |
| As any user, in the live details page, below the highlighted product, an AuctionCard shows the current winner's nickname, current price, and time remaining                | done   |

## Initial Prompt

> As a seller and host, in the live details page, when there is a highlighted product, instead of seeing "Acheter tout de suite", "+5€" and "+10€", I want to see the button "Commencer les enchères". If there is no highlighted product, I see the button "Choisir un produit à mettre en avant", it will then scroll smoothly to the 2nd MobilePage in the "Boutique du live" tab. When clicking on "Commencer les enchères", it opens the AuctionConfigModal to setup the auction and confirm the start.
>
> If the auction has started, the button becomes "Vendre à <auction_winner's_nickname>". If there is no winner yet, the button is "Annuler l'enchère".
>
> As a buyer, in the live details page, the buttons "Acheter tout de suite", "+5€" and "+10€" are disabled if the auction hasn't started. If the auction has started, when pressing on the "+5€" or "+10€", it bids an additional amount directly.
>
> As any users, in the live details page, below the highlighted product, there should be a new card with the following information: current auction's winner's nickname, current price of the auction, the time left in the auction.
