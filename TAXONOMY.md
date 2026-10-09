# Master taxonomy

Every store category is mapped onto this tree (department › subcategory).
Gender, function (insulated, windproof, water-resistant, reflective) and material are separate filters, not categories.
Rules live in `scripts/lib/taxonomy.mjs`; products the rules can only guess are classified by Claude (`data/ai-categories.json`).

## Tops

- **T-shirts** `tops/t-shirts` · 1741 products
- **Long sleeve** `tops/long-sleeve` · 921 products
- **Singlets & tanks** `tops/singlets` · 1128 products
- **Shirts** `tops/shirts` · 78 products
- **Sports bras** `tops/sports-bras` · 282 products
- **Base layer tops** `tops/base-layers` · 81 products

## Mid layers

- **Fleece, knit & half-zips** `midlayers/fleece-knit` · 280 products
- **Hoodies & sweatshirts** `midlayers/hoodies` · 325 products

## Outerwear

- **Wind & rain jackets** `outerwear/wind-rain` · 644 products
- **Shell jackets** `outerwear/shell` · 48 products
- **Down & insulated** `outerwear/insulated` · 134 products
- **Vests & gilets** `outerwear/vests` · 90 products
- **Other jackets** `outerwear/jackets` · 56 products

## Bottoms

- **Shorts** `bottoms/shorts` · 1570 products
- **Tights & leggings** `bottoms/tights` · 1036 products
- **Pants** `bottoms/pants` · 321 products
- **Shell & rain pants** `bottoms/shell-pants` · 27 products
- **Skirts** `bottoms/skirts` · 6 products
- **Base layer bottoms** `bottoms/base-layers` · 2 products
- **Underwear** `bottoms/underwear` · 102 products

## Footwear

- **Road running** `footwear/road-running` · 3672 products
- **Trail running** `footwear/trail-running` · 331 products
- **Hiking** `footwear/hiking` · 43 products
- **Boots** `footwear/boots` · 21 products
- **Casual & lifestyle** `footwear/casual` · 192 products
- **Slides & sandals** `footwear/slides-sandals` · 39 products
- **Court & tennis** `footwear/court` · 3 products
- **Other footwear** `footwear/other` · 0 products

## Accessories

- **Caps** `accessories/caps` · 302 products
- **Beanies** `accessories/beanies` · 116 products
- **Hats & headbands** `accessories/hats` · 174 products
- **Neck warmers, bandanas & balaclavas** `accessories/neckwear` · 104 products
- **Gloves & mittens** `accessories/gloves` · 71 products
- **Socks** `accessories/socks` · 955 products
- **Sunglasses & eyewear** `accessories/sunglasses` · 267 products
- **Watches** `accessories/watches` · 134 products
- **Hydration** `accessories/hydration` · 85 products
- **Headlamps & running lights** `accessories/lights` · 38 products
- **Insoles & shoe care** `accessories/insoles-care` · 51 products
- **Supports, protection & anti-chafe** `accessories/protection` · 66 products
- **Other accessories** `accessories/other` · 41 products

## Bags

- **Backpacks** `bags/backpacks` · 73 products
- **Duffels & totes** `bags/duffels-totes` · 52 products
- **Small bags & running belts** `bags/small-bags` · 83 products

## Gear & lifestyle _(hidden by default)_

- **Cooking** `gear/cooking` · 14 products
- **Knives & tools** `gear/knives-tools` · 7 products
- **Camping & sleeping** `gear/camping` · 6 products
- **Climbing** `gear/climbing` · 17 products
- **Furniture** `gear/furniture` · 15 products
- **Lighting** `gear/lighting` · 1 products
- **Books & magazines** `gear/books-media` · 17 products
- **Sports nutrition** `gear/nutrition` · 99 products
- **Fitness equipment** `gear/fitness` · 56 products
- **Headphones & electronics** `gear/electronics` · 27 products
- **Other gear** `gear/other` · 1 products

## Store category mapping

| Store | Store category | Mapped to |
|---|---|---|
| ACT Running | (none) | Tops › T-shirts (13), Outerwear › Wind & rain jackets (9), Tops › Singlets & tanks (5), Mid layers › Hoodies & sweatshirts (5), Accessories › Socks (4), Bottoms › Tights & leggings (3), Tops › Base layer tops (2), Tops › Long sleeve (2), Bottoms › Shorts (2), Accessories › Beanies (2), Tops › Shirts (1), Accessories › Caps (1), Accessories › Neck warmers, bandanas & balaclavas (1) |
| ACT Running | Accessories | Accessories › Caps (14), Accessories › Beanies (6), Accessories › Socks (4), Accessories › Neck warmers, bandanas & balaclavas (3), Accessories › Gloves & mittens (3), Accessories › Hats & headbands (1) |
| ACT Running | Bottoms | Bottoms › Shorts (43), Bottoms › Tights & leggings (5) |
| ACT Running | Chaussures | Footwear › Road running (5) |
| ACT Running | Fleece Hoodie | Mid layers › Hoodies & sweatshirts (2) |
| ACT Running | Serré | Bottoms › Tights & leggings (1) |
| ACT Running | Top | Tops › T-shirts (22), Tops › Singlets & tanks (11), Mid layers › Fleece, knit & half-zips (10), Outerwear › Wind & rain jackets (8), Tops › Base layer tops (1), Tops › Long sleeve (1) |
| ACT Running | Tops | Tops › Singlets & tanks (1), Tops › T-shirts (1) |
| ACT Running | Vintage Windbreaker | Outerwear › Wind & rain jackets (1) |
| Bandit | (none) | Bottoms › Shorts (48), Tops › T-shirts (30), Tops › Singlets & tanks (29), Tops › Sports bras (29), Bottoms › Tights & leggings (25), Tops › Long sleeve (19), Accessories › Hats & headbands (14), Accessories › Socks (10), Accessories › Supports, protection & anti-chafe (9), Mid layers › Hoodies & sweatshirts (8), Accessories › Sunglasses & eyewear (5), Bottoms › Pants (4), Mid layers › Fleece, knit & half-zips (4), Other › Other (3), Tops › Shirts (1), Accessories › Hydration (1), Accessories › Other accessories (1), Footwear › Road running (1), Gear & lifestyle › Books & magazines (1), Accessories › Beanies (1) |
| Bandit | Accessories | Accessories › Hats & headbands (64), Accessories › Socks (53), Accessories › Supports, protection & anti-chafe (16), Accessories › Sunglasses & eyewear (7), Accessories › Neck warmers, bandanas & balaclavas (4), Accessories › Beanies (4), Accessories › Other accessories (2), Accessories › Gloves & mittens (2), Accessories › Hydration (1), Bags › Small bags & running belts (1) |
| Bandit | BOTTOMS | Bottoms › Shorts (3) |
| Bandit | Bottom | Bottoms › Shorts (26), Bottoms › Tights & leggings (14), Other › Other (2), Bottoms › Pants (2) |
| Bandit | Bottoms | Bottoms › Shorts (123), Bottoms › Tights & leggings (59), Bottoms › Pants (12), Other › Other (3), Mid layers › Hoodies & sweatshirts (2), Gear & lifestyle › Climbing (2), Bottoms › Skirts (1), Tops › Long sleeve (1) |
| Bandit | Crops | Tops › Singlets & tanks (2) |
| Bandit | Insurance | Other › Other (1) |
| Bandit | Membership | Other › Other (1) |
| Bandit | Outerwear | Mid layers › Hoodies & sweatshirts (27), Outerwear › Wind & rain jackets (9), Tops › Singlets & tanks (3), Outerwear › Other jackets (2), Outerwear › Down & insulated (1), Mid layers › Fleece, knit & half-zips (1), Footwear › Road running (1) |
| Bandit | TOPS | Tops › Long sleeve (1), Tops › T-shirts (1) |
| Bandit | Tee | Tops › T-shirts (1) |
| Bandit | Top | Tops › T-shirts (1) |
| Bandit | Tops | Tops › Singlets & tanks (156), Tops › T-shirts (116), Tops › Long sleeve (70), Tops › Sports bras (44), Mid layers › Hoodies & sweatshirts (20), Mid layers › Fleece, knit & half-zips (14), Gear & lifestyle › Climbing (8), Footwear › Road running (3), Outerwear › Other jackets (2), Outerwear › Wind & rain jackets (1) |
| Bandit | Unclassified | Accessories › Sunglasses & eyewear (5), Accessories › Hats & headbands (4), Gear & lifestyle › Cooking (2), Mid layers › Hoodies & sweatshirts (1), Accessories › Socks (1), Tops › Sports bras (1), Bags › Duffels & totes (1), Tops › T-shirts (1) |
| Bandit | Underwear | Bottoms › Underwear (1) |
| DOXA | Acc. | Accessories › Socks (8), Accessories › Caps (4), Accessories › Beanies (3), Accessories › Neck warmers, bandanas & balaclavas (2), Accessories › Gloves & mittens (2), Accessories › Hats & headbands (1), Accessories › Other accessories (1) |
| DOXA | Jacket | Outerwear › Wind & rain jackets (4) |
| DOXA | Pant | Bottoms › Pants (1) |
| DOXA | Shorts | Bottoms › Shorts (4) |
| DOXA | Singlet | Tops › Singlets & tanks (11) |
| DOXA | Tee LS | Tops › T-shirts (10), Mid layers › Fleece, knit & half-zips (4) |
| DOXA | Tee SS | Tops › T-shirts (13) |
| DOXA | Tights | Bottoms › Tights & leggings (8) |
| District Vision | Accessories | Accessories › Socks (30), Accessories › Hats & headbands (23), Accessories › Sunglasses & eyewear (4), Accessories › Beanies (2), Accessories › Neck warmers, bandanas & balaclavas (1), Accessories › Gloves & mittens (1) |
| District Vision | Eyewear | Accessories › Sunglasses & eyewear (153) |
| District Vision | Footwear | Footwear › Road running (8), Footwear › Trail running (1) |
| District Vision | Mens | Bottoms › Shorts (47), Tops › Long sleeve (33), Tops › T-shirts (26), Bottoms › Tights & leggings (22), Outerwear › Wind & rain jackets (17), Bottoms › Pants (15), Tops › Singlets & tanks (10), Mid layers › Fleece, knit & half-zips (6), Mid layers › Hoodies & sweatshirts (5), Tops › Base layer tops (3), Outerwear › Shell jackets (2), Outerwear › Down & insulated (1) |
| District Vision | Unisex | Tops › T-shirts (47), Mid layers › Hoodies & sweatshirts (22), Mid layers › Fleece, knit & half-zips (7), Footwear › Road running (2), Outerwear › Down & insulated (2), Tops › Long sleeve (1) |
| District Vision | Womens | Bottoms › Shorts (29), Bottoms › Tights & leggings (29), Tops › T-shirts (26), Tops › Long sleeve (16), Tops › Sports bras (16), Mid layers › Fleece, knit & half-zips (7), Tops › Singlets & tanks (6), Tops › Base layer tops (4), Outerwear › Wind & rain jackets (4), Mid layers › Hoodies & sweatshirts (1), Bottoms › Pants (1) |
| Incylence | Compression Socks | Accessories › Socks (4) |
| Incylence | Headband Narrow | Accessories › Hats & headbands (8) |
| Incylence | Headband Wide | Accessories › Hats & headbands (7) |
| Incylence | High-Viz Socks | Visible Running Socks with Reflectors | Accessories › Socks (1) |
| Incylence | High-Viz | Accessories › Socks (4) |
| Incylence | High-visual | Accessories › Socks (5) |
| Incylence | Reco | Accessories › Socks (1) |
| Incylence | Renewed 97 | Accessories › Socks (5) |
| Incylence | Running Cap | Accessories › Caps (5) |
| Incylence | Running High-Cut | Accessories › Socks (40) |
| Incylence | Running Low-Cut | Bottoms › Shorts (15) |
| Incylence | merino | Accessories › Socks (8) |
| KA-YO | BH:ar | Tops › Sports bras (15), Tops › Singlets & tanks (2) |
| KA-YO | Balaklava | Accessories › Neck warmers, bandanas & balaclavas (3) |
| KA-YO | Belysning | Gear & lifestyle › Lighting (1) |
| KA-YO | Bucket Hats | Accessories › Hats & headbands (5) |
| KA-YO | Climb | Accessories › Other accessories (1) |
| KA-YO | Dam Byxor | Bottoms › Pants (16) |
| KA-YO | Dam Dunjackor | Outerwear › Down & insulated (8), Outerwear › Wind & rain jackets (1) |
| KA-YO | Dam Fleece & Stickat | Mid layers › Fleece, knit & half-zips (14), Mid layers › Hoodies & sweatshirts (2) |
| KA-YO | Dam Linnen | Tops › Singlets & tanks (33) |
| KA-YO | Dam Longsleeve T-shirts | Tops › Long sleeve (23) |
| KA-YO | Dam Lättviktsdunjackor | Outerwear › Down & insulated (5) |
| KA-YO | Dam Löparkläder | Accessories › Other accessories (1) |
| KA-YO | Dam Löparskor | Footwear › Road running (103), Footwear › Trail running (1) |
| KA-YO | Dam Shorts & Kjolar | Bottoms › Shorts (43), Bottoms › Tights & leggings (1) |
| KA-YO | Dam Skalbyxor | Bottoms › Shell & rain pants (5) |
| KA-YO | Dam Skaljackor | Outerwear › Shell jackets (4), Outerwear › Wind & rain jackets (4) |
| KA-YO | Dam Strumpor | Accessories › Socks (1) |
| KA-YO | Dam T-shirts | Tops › T-shirts (35) |
| KA-YO | Dam Tights | Bottoms › Tights & leggings (30), Bottoms › Shorts (4) |
| KA-YO | Dam Trailrunning Skor | Footwear › Trail running (18) |
| KA-YO | Dam Underställ | Tops › Base layer tops (5) |
| KA-YO | Dam Vandringsskor | Footwear › Hiking (14) |
| KA-YO | Dam Vardagsskor | Footwear › Casual & lifestyle (41) |
| KA-YO | Dam Vind & Regnjackor | Outerwear › Wind & rain jackets (31), Outerwear › Down & insulated (2) |
| KA-YO | Dam tofflor | Footwear › Slides & sandals (5) |
| KA-YO | Dam Överdelar | Mid layers › Fleece, knit & half-zips (1) |
| KA-YO | Damkängor | Footwear › Boots (7) |
| KA-YO | Damtennisskor | Footwear › Court & tennis (3) |
| KA-YO | Damtröjor & Hoodies | Mid layers › Hoodies & sweatshirts (13), Mid layers › Fleece, knit & half-zips (2) |
| KA-YO | Damvästar | Outerwear › Vests & gilets (6) |
| KA-YO | Duffel & Toteväskor | Bags › Duffels & totes (50) |
| KA-YO | Glasögon | Accessories › Sunglasses & eyewear (39) |
| KA-YO | Handskar | Accessories › Gloves & mittens (21) |
| KA-YO | Headwear | Accessories › Hats & headbands (4), Accessories › Caps (2) |
| KA-YO | Herr Byxor | Bottoms › Pants (91), Bottoms › Shell & rain pants (4), Bottoms › Shorts (2) |
| KA-YO | Herr Fleece & Stickat | Mid layers › Fleece, knit & half-zips (44), Mid layers › Hoodies & sweatshirts (3) |
| KA-YO | Herr Longsleeve T-shirts | Tops › Long sleeve (59), Tops › Shirts (1) |
| KA-YO | Herr Lättviktsdunjackor | Outerwear › Down & insulated (30), Outerwear › Wind & rain jackets (1) |
| KA-YO | Herr Löparkläder | Bottoms › Pants (1) |
| KA-YO | Herr Löparskor | Footwear › Road running (121), Footwear › Trail running (4) |
| KA-YO | Herr Shorts | Bottoms › Shorts (98), Bottoms › Tights & leggings (2) |
| KA-YO | Herr Skaljackor | Outerwear › Shell jackets (32), Outerwear › Wind & rain jackets (14), Outerwear › Down & insulated (1) |
| KA-YO | Herr Strumpor | Accessories › Socks (26) |
| KA-YO | Herr T-shirts | Tops › T-shirts (189), Tops › Shirts (5), Mid layers › Fleece, knit & half-zips (3), Bottoms › Shorts (2), Tops › Singlets & tanks (2), Tops › Base layer tops (1), Tops › Long sleeve (1), Mid layers › Hoodies & sweatshirts (1) |
| KA-YO | Herr Tights | Bottoms › Tights & leggings (8), Bottoms › Shorts (2) |
| KA-YO | Herr Trailrunning Skor | Footwear › Trail running (44), Footwear › Road running (1) |
| KA-YO | Herr Underställ | Tops › Base layer tops (10), Tops › Long sleeve (1) |
| KA-YO | Herr Vandringsskor | Footwear › Hiking (29) |
| KA-YO | Herr Vardagsskor | Footwear › Casual & lifestyle (109), Footwear › Boots (1) |
| KA-YO | Herr Vind & Regnjackor | Outerwear › Wind & rain jackets (96), Outerwear › Down & insulated (6), Outerwear › Shell jackets (3) |
| KA-YO | Herr linnen | Tops › Singlets & tanks (31) |
| KA-YO | Herr skalbyxor | Bottoms › Shell & rain pants (12) |
| KA-YO | Herr skjortor | Tops › Shirts (29) |
| KA-YO | Herr tofflor | Footwear › Slides & sandals (13) |
| KA-YO | Herr Överdelar | Tops › T-shirts (1), Tops › Singlets & tanks (1) |
| KA-YO | Herrdunjackor | Outerwear › Down & insulated (43) |
| KA-YO | Herrjackor | Outerwear › Other jackets (3), Outerwear › Wind & rain jackets (2), Tops › Shirts (1), Mid layers › Fleece, knit & half-zips (1) |
| KA-YO | Herrkängor | Footwear › Boots (12) |
| KA-YO | Herrtröjor & Hoodies | Mid layers › Hoodies & sweatshirts (50), Mid layers › Fleece, knit & half-zips (7) |
| KA-YO | Herrvästar | Outerwear › Vests & gilets (26), Outerwear › Down & insulated (5) |
| KA-YO | Hydrering | Accessories › Hydration (22) |
| KA-YO | KA_YO_PROTOTYPE | Accessories › Neck warmers, bandanas & balaclavas (1), Bags › Small bags & running belts (1), Tops › Shirts (1), Bottoms › Pants (1), Outerwear › Wind & rain jackets (1) |
| KA-YO | Kepsar | Accessories › Caps (61), Accessories › Hats & headbands (11) |
| KA-YO | Klockor | Accessories › Watches (6) |
| KA-YO | Klättringsutrustning | Gear & lifestyle › Climbing (4) |
| KA-YO | Knivar och Verktyg | Gear & lifestyle › Knives & tools (6) |
| KA-YO | Matlagning | Gear & lifestyle › Cooking (10) |
| KA-YO | Möbler | Gear & lifestyle › Furniture (15) |
| KA-YO | Mössor | Accessories › Beanies (39), Accessories › Hats & headbands (6), Accessories › Caps (1) |
| KA-YO | Nackvärmare | Accessories › Neck warmers, bandanas & balaclavas (6), Accessories › Hats & headbands (1) |
| KA-YO | Nyheter | Accessories › Caps (1) |
| KA-YO | Objekt | Other › Other (4), Gear & lifestyle › Books & magazines (3), Gear & lifestyle › Camping & sleeping (3), Accessories › Other accessories (2), Gear & lifestyle › Cooking (1) |
| KA-YO | REA | Mid layers › Fleece, knit & half-zips (1) |
| KA-YO | Ryggsäckar | Bags › Backpacks (33) |
| KA-YO | Ski & Snow | Accessories › Gloves & mittens (1) |
| KA-YO | Små väskor | Bags › Small bags & running belts (41) |
| KA-YO | Sovsäckar & Underlag | Gear & lifestyle › Camping & sleeping (2) |
| KA-YO | Tältar | Gear & lifestyle › Camping & sleeping (1) |
| KA-YO | Vattenflaskor | Accessories › Hydration (6) |
| KA-YO | Väskor & Ryggsäckar | Bags › Backpacks (1) |
| KA-YO | Väskor | Bags › Small bags & running belts (1) |
| Löplabbet | Kläder/Accessoarer/Handskar | Accessories › Gloves & mittens (20) |
| Löplabbet | Kläder/Accessoarer/Kepsar | Accessories › Caps (54) |
| Löplabbet | Kläder/Accessoarer/Mössa | Accessories › Beanies (36), Accessories › Hats & headbands (8), Accessories › Neck warmers, bandanas & balaclavas (5) |
| Löplabbet | Kläder/Accessoarer/Mössor | Accessories › Beanies (6) |
| Löplabbet | Kläder/Accessoarer/Pannband | Accessories › Hats & headbands (2) |
| Löplabbet | Kläder/Accessoarer/Reflexväst | Accessories › Hydration (2), Accessories › Other accessories (2), Tops › Singlets & tanks (1) |
| Löplabbet | Kläder/Accessoarer/Övriga Accessoarer | Accessories › Other accessories (2) |
| Löplabbet | Kläder/Byxor | Bottoms › Pants (16), Bottoms › Tights & leggings (4) |
| Löplabbet | Kläder/Byxor/Träningsbyxor | Bottoms › Pants (10) |
| Löplabbet | Kläder/Jackor | Outerwear › Wind & rain jackets (69), Accessories › Hydration (8), Footwear › Road running (3) |
| Löplabbet | Kläder/Jackor/Träningsjackor | Outerwear › Wind & rain jackets (18) |
| Löplabbet | Kläder/Jackor/Västar | Outerwear › Vests & gilets (2) |
| Löplabbet | Kläder/Kjol | Bottoms › Skirts (1) |
| Löplabbet | Kläder/Kjolar & Klänningar | Bottoms › Skirts (1) |
| Löplabbet | Kläder/Linnen | Tops › Singlets & tanks (54) |
| Löplabbet | Kläder/Linnen/Linnen funktion | Tops › Singlets & tanks (6) |
| Löplabbet | Kläder/Shorts | Bottoms › Shorts (84), Bottoms › Tights & leggings (13), Bottoms › Skirts (1) |
| Löplabbet | Kläder/Shorts/Träningsshorts | Bottoms › Shorts (38) |
| Löplabbet | Kläder/Strumpor | Accessories › Socks (147), Accessories › Supports, protection & anti-chafe (1) |
| Löplabbet | Kläder/T-Shirt & Toppar/T-Shirt funktion | Tops › T-shirts (39), Tops › Shirts (2) |
| Löplabbet | Kläder/T-Shirt & Toppar/T-Shirt | Accessories › Watches (1) |
| Löplabbet | Kläder/T-shirt & Toppar | Tops › T-shirts (75), Tops › Long sleeve (25), Footwear › Road running (13), Mid layers › Fleece, knit & half-zips (9), Mid layers › Hoodies & sweatshirts (6), Tops › Shirts (4), Bottoms › Shorts (1) |
| Löplabbet | Kläder/Tights | Bottoms › Tights & leggings (65) |
| Löplabbet | Kläder/Tights/Löpartights | Bottoms › Tights & leggings (25), Bottoms › Shorts (1) |
| Löplabbet | Kläder/Tights/Träningstights | Bottoms › Tights & leggings (4) |
| Löplabbet | Kläder/Tights/Vintertights | Bottoms › Tights & leggings (3) |
| Löplabbet | Kläder/Tröjor/Träningströjor | Mid layers › Fleece, knit & half-zips (17), Tops › T-shirts (6), Tops › Long sleeve (1) |
| Löplabbet | Kläder/Underkläder/Kalsonger | Bottoms › Underwear (5) |
| Löplabbet | Kläder/Underkläder/Kompression | Accessories › Socks (1) |
| Löplabbet | Kläder/Underkläder/Sport-BH | Tops › Sports bras (16) |
| Löplabbet | Kläder/Underkläder/Sport-BH/High | Tops › Sports bras (3) |
| Löplabbet | Kläder/Underkläder/Sport-BH/Low | Tops › Sports bras (1) |
| Löplabbet | Kläder/Underkläder/Sport-BH/Medium | Tops › Sports bras (1) |
| Löplabbet | Kläder/Underkläder/Strumpor | Accessories › Socks (19) |
| Löplabbet | Kläder/Underkläder/Trosor | Bottoms › Underwear (4) |
| Löplabbet | Kläder/Underkläder/Underställ | Tops › Base layer tops (20), Tops › Long sleeve (5) |
| Löplabbet | Löparskor/Distans | Footwear › Road running (325), Footwear › Trail running (2) |
| Löplabbet | Löparskor/Friidrott | Footwear › Road running (12) |
| Löplabbet | Löparskor/Promenad | Footwear › Casual & lifestyle (30), Footwear › Road running (3) |
| Löplabbet | Löparskor/Tempo | Footwear › Road running (163), Footwear › Trail running (1) |
| Löplabbet | Löparskor/Terräng | Footwear › Trail running (135), Footwear › Road running (2) |
| Löplabbet | Löparskor/Återhämtning | Footwear › Slides & sandals (6) |
| Löplabbet | Skor/Löparskor/Distans/Neutral | Footwear › Road running (269) |
| Löplabbet | Skor/Löparskor/Distans/Stabil | Footwear › Road running (90) |
| Löplabbet | Skor/Löparskor/Tempo | Footwear › Road running (132) |
| Löplabbet | Skor/Löparskor/Trailskor | Footwear › Trail running (64), Footwear › Road running (2) |
| Löplabbet | Skor/Sandaler & Tofflor | Footwear › Slides & sandals (12) |
| Löplabbet | Skor/Träningsskor | Footwear › Road running (2) |
| Löplabbet | Skor/Walkingskor | Footwear › Casual & lifestyle (12) |
| Löplabbet | Tillbehör/Antiskav | Accessories › Supports, protection & anti-chafe (3) |
| Löplabbet | Tillbehör/Energi & Sportdryck | Gear & lifestyle › Sports nutrition (80) |
| Löplabbet | Tillbehör/Glasögon | Accessories › Sunglasses & eyewear (18) |
| Löplabbet | Tillbehör/Hörlurar | Gear & lifestyle › Headphones & electronics (16) |
| Löplabbet | Tillbehör/Klockor och tillbehör | Accessories › Watches (36) |
| Löplabbet | Tillbehör/Lampor | Accessories › Headlamps & running lights (32), Accessories › Neck warmers, bandanas & balaclavas (1) |
| Löplabbet | Tillbehör/Löpband | Gear & lifestyle › Fitness equipment (1) |
| Löplabbet | Tillbehör/Midjeväskor & Mobilhållare | Bags › Small bags & running belts (16) |
| Löplabbet | Tillbehör/Presentkort | Other › Other (1) |
| Löplabbet | Tillbehör/Ryggsäckar & Vätskesystem | Bags › Backpacks (23) |
| Löplabbet | Tillbehör/Sko och klädvård | Accessories › Insoles & shoe care (8) |
| Löplabbet | Tillbehör/Skydd | Accessories › Supports, protection & anti-chafe (25) |
| Löplabbet | Tillbehör/Sulor | Accessories › Insoles & shoe care (12) |
| Löplabbet | Tillbehör/Träningsredskap | Gear & lifestyle › Fitness equipment (49) |
| Löplabbet | Tillbehör/Övriga accessoarer | Accessories › Insoles & shoe care (11), Accessories › Other accessories (9), Footwear › Trail running (8), Gear & lifestyle › Fitness equipment (4), Accessories › Neck warmers, bandanas & balaclavas (2), Accessories › Hats & headbands (1), Accessories › Supports, protection & anti-chafe (1) |
| Löplabbet | Utrustning/Elektronik | Gear & lifestyle › Headphones & electronics (2) |
| Löplabbet | Utrustning/Elektronik/Mobiltillbehör | Gear & lifestyle › Headphones & electronics (9) |
| Löplabbet | Utrustning/Elektronik/Pannlampor | Accessories › Headlamps & running lights (6) |
| Löplabbet | Utrustning/Elektronik/Pulsklockor | Accessories › Watches (89) |
| Löplabbet | Utrustning/Glasögon/Sportglasögon | Accessories › Sunglasses & eyewear (10) |
| Löplabbet | Utrustning/Längdtillbehör/Övriga tillbehör | Accessories › Other accessories (1) |
| Löplabbet | Utrustning/Skydd/Benskydd | Accessories › Supports, protection & anti-chafe (2) |
| Löplabbet | Utrustning/Skydd/Knäskydd | Accessories › Supports, protection & anti-chafe (3) |
| Löplabbet | Utrustning/Skydd/Övriga skydd | Accessories › Supports, protection & anti-chafe (3) |
| Löplabbet | Utrustning/Träningsredskap/Yogamattor | Gear & lifestyle › Fitness equipment (2) |
| Löplabbet | Utrustning/Väskor/Bagar | Bags › Duffels & totes (1) |
| Löplabbet | Utrustning/Väskor/Midjeväskor | Bags › Small bags & running belts (13) |
| Löplabbet | Utrustning/Väskor/Ryggsäckar/Löparryggsäckar | Bags › Backpacks (11) |
| Löplabbet | Utrustning/Väskor/Övriga väskor | Bags › Backpacks (1) |
| Löplabbet | Utrustning/Övrigt/Flaskor & Vätskebälten | Accessories › Hydration (14) |
| Löplabbet | Utrustning/Övrigt/Kosttillskott | Gear & lifestyle › Sports nutrition (19) |
| Löplabbet | Utrustning/Övrigt/Skotillbehör | Accessories › Insoles & shoe care (16) |
| Löplabbet | Utrustning/Övrigt/Skotillbehör/Skosulor | Accessories › Insoles & shoe care (4) |
| Löplabbet | Utrustning/Övrigt/Träningsvästar | Outerwear › Vests & gilets (2) |
| Passa Sports | Löparkläder/Kläder | Bottoms › Shorts (707), Tops › T-shirts (693), Bottoms › Tights & leggings (581), Tops › Long sleeve (457), Tops › Singlets & tanks (422), Outerwear › Wind & rain jackets (298), Footwear › Road running (173), Tops › Sports bras (148), Bottoms › Pants (109), Mid layers › Fleece, knit & half-zips (87), Bottoms › Underwear (83), Mid layers › Hoodies & sweatshirts (78), Other › Other (69), Outerwear › Other jackets (48), Outerwear › Vests & gilets (46), Outerwear › Down & insulated (24), Accessories › Hydration (11), Tops › Base layer tops (8), Outerwear › Shell jackets (6), Tops › Shirts (4), Bottoms › Skirts (2), Bottoms › Base layer bottoms (2) |
| Passa Sports | Löparkläder/Tillbehör | Accessories › Hydration (1) |
| Passa Sports | Löparskor/Skor | Footwear › Road running (2225), Footwear › Trail running (44), Footwear › Slides & sandals (1) |
| Passa Sports | Löparstrumpor/Strumpor | Accessories › Socks (432), Accessories › Neck warmers, bandanas & balaclavas (20) |
| Passa Sports | Löparstrumpor/Tillbehör | Accessories › Socks (2) |
| SAYSKY | ACCESSORIES | Accessories › Neck warmers, bandanas & balaclavas (7), Accessories › Gloves & mittens (4), Accessories › Other accessories (3), Gear & lifestyle › Cooking (1) |
| SAYSKY | BAGS | Bags › Small bags & running belts (5), Bags › Backpacks (4), Tops › Singlets & tanks (4) |
| SAYSKY | Bundle | Other › Other (9), Tops › T-shirts (8), Tops › Long sleeve (5), Tops › Singlets & tanks (5), Accessories › Socks (4), Bottoms › Shorts (4), Accessories › Caps (3), Tops › Shirts (1), Bottoms › Tights & leggings (1), Mid layers › Fleece, knit & half-zips (1) |
| SAYSKY | EYEWEAR | Accessories › Sunglasses & eyewear (1) |
| SAYSKY | FLEECE | Mid layers › Fleece, knit & half-zips (11), Mid layers › Hoodies & sweatshirts (7) |
| SAYSKY | FOOTWEAR | Footwear › Road running (4), Footwear › Trail running (1) |
| SAYSKY | HEADWEAR | Accessories › Caps (53), Accessories › Hats & headbands (6), Accessories › Neck warmers, bandanas & balaclavas (3), Accessories › Beanies (1) |
| SAYSKY | JACKETS/VESTS | Tops › Singlets & tanks (31), Outerwear › Wind & rain jackets (12), Mid layers › Hoodies & sweatshirts (6), Outerwear › Down & insulated (5) |
| SAYSKY | LONG SLEEVES | Tops › Long sleeve (83) |
| SAYSKY | PANTS | Bottoms › Pants (17) |
| SAYSKY | SHIRTS | Tops › Shirts (1) |
| SAYSKY | SHORT TIGHTS | Bottoms › Tights & leggings (36) |
| SAYSKY | SHORTS | Bottoms › Shorts (70) |
| SAYSKY | SINGLETS | Tops › Singlets & tanks (96), Tops › Base layer tops (7) |
| SAYSKY | SOCKS | Accessories › Socks (46) |
| SAYSKY | SPORTS BRA | Tops › Sports bras (8), Tops › Singlets & tanks (2) |
| SAYSKY | SWEATSHIRTS | Mid layers › Hoodies & sweatshirts (24) |
| SAYSKY | T-SHIRTS | Tops › T-shirts (147), Tops › Base layer tops (3) |
| SAYSKY | TANKS | Tops › Singlets & tanks (11) |
| SAYSKY | TIGHTS | Bottoms › Tights & leggings (31), Bottoms › Underwear (2) |
| SAYSKY | TOPS | Tops › Singlets & tanks (11) |
| SAYSKY | UNDERWEAR | Bottoms › Underwear (3) |
| SOAR | Accessory | Accessories › Socks (10), Accessories › Other accessories (2), Accessories › Beanies (2), Accessories › Hydration (2), Accessories › Supports, protection & anti-chafe (1), Accessories › Caps (1), Accessories › Neck warmers, bandanas & balaclavas (1), Accessories › Gloves & mittens (1), Bottoms › Underwear (1) |
| SOAR | April 26 launches | Bottoms › Shorts (14), Tops › T-shirts (8), Tops › Singlets & tanks (8), Tops › Long sleeve (5), Accessories › Caps (5), Bottoms › Tights & leggings (2), Accessories › Other accessories (2) |
| SOAR | August 25 launches | Tops › Long sleeve (3), Tops › Base layer tops (2), Tops › Singlets & tanks (2), Bottoms › Shorts (1), Tops › T-shirts (1) |
| SOAR | August 26 launches | Tops › Singlets & tanks (23), Bottoms › Shorts (21), Tops › T-shirts (15), Tops › Long sleeve (14), Accessories › Socks (11), Accessories › Caps (10), Tops › Base layer tops (2), Tops › Shirts (1), Accessories › Other accessories (1) |
| SOAR | Custom Bundle | Other › Other (1) |
| SOAR | Custom Vest | Tops › Singlets & tanks (2) |
| SOAR | February 26 launches | Bottoms › Shorts (22), Accessories › Socks (8), Accessories › Caps (6), Tops › Singlets & tanks (3), Tops › T-shirts (2), Tops › Long sleeve (2), Other › Other (1), Bottoms › Underwear (1) |
| SOAR | January 26 launches | Tops › Singlets & tanks (13), Bottoms › Shorts (6), Tops › T-shirts (4), Tops › Long sleeve (1) |
| SOAR | June 26 Launches | Accessories › Hydration (4) |
| SOAR | June 26 launches | Bottoms › Shorts (1) |
| SOAR | March 26 launches | Tops › Singlets & tanks (7), Tops › T-shirts (3), Accessories › Socks (2), Bottoms › Pants (2), Outerwear › Vests & gilets (2), Accessories › Sunglasses & eyewear (2), Accessories › Other accessories (1), Bottoms › Tights & leggings (1), Bottoms › Shorts (1) |
| SOAR | Men's August 25 | Tops › Singlets & tanks (2), Bottoms › Shorts (1) |
| SOAR | Mens AW23 | Tops › Singlets & tanks (1) |
| SOAR | November 25 launches | Accessories › Socks (8), Tops › T-shirts (1), Tops › Base layer tops (1) |
| SOAR | October 25 launches | Bottoms › Tights & leggings (5), Outerwear › Wind & rain jackets (4), Gear & lifestyle › Climbing (3), Tops › Long sleeve (3), Mid layers › Hoodies & sweatshirts (1), Outerwear › Vests & gilets (1), Accessories › Beanies (1), Tops › Base layer tops (1) |
| SOAR | October 26 launches | Outerwear › Wind & rain jackets (4), Bottoms › Pants (2), Outerwear › Vests & gilets (2), Tops › Singlets & tanks (2) |
| SOAR | September 25 launches | Bottoms › Shorts (3), Accessories › Other accessories (2), Bottoms › Tights & leggings (1), Outerwear › Vests & gilets (1), Tops › Singlets & tanks (1) |
| SOAR | September 26 launches | Bottoms › Tights & leggings (7), Tops › Long sleeve (7), Tops › Base layer tops (6), Outerwear › Wind & rain jackets (3), Mid layers › Hoodies & sweatshirts (3), Accessories › Beanies (3), Accessories › Neck warmers, bandanas & balaclavas (3), Accessories › Other accessories (2), Outerwear › Vests & gilets (2), Accessories › Hats & headbands (1), Bottoms › Shorts (1), Bottoms › Pants (1), Accessories › Gloves & mittens (1), Outerwear › Shell jackets (1), Bottoms › Underwear (1) |
| SOAR | Tops | Tops › Singlets & tanks (1) |
| SOAR | Womens SS25 | Tops › Singlets & tanks (3) |
| SUMS | (none) | Other › Other (1) |
| SUMS | Magazine | Gear & lifestyle › Books & magazines (1) |
| SUMS | Singlet | Tops › Singlets & tanks (2) |
| SUMS | T-shirt | Tops › T-shirts (2) |
| SUMS | Windbreaker | Outerwear › Wind & rain jackets (2) |
| SUMS | cap | Accessories › Caps (1) |
| SUMS | sock | Accessories › Socks (9) |
| Satisfy | (none) | Tops › T-shirts (103), Bottoms › Shorts (38), Accessories › Caps (35), Tops › Singlets & tanks (32), Tops › Long sleeve (27), Accessories › Neck warmers, bandanas & balaclavas (18), Tops › Shirts (13), Bottoms › Pants (10), Mid layers › Hoodies & sweatshirts (8), Mid layers › Fleece, knit & half-zips (8), Bottoms › Tights & leggings (7), Outerwear › Wind & rain jackets (7), Accessories › Sunglasses & eyewear (6), Accessories › Socks (5), Accessories › Gloves & mittens (5), Tops › Base layer tops (4), Accessories › Beanies (4), Footwear › Road running (3), Accessories › Hydration (3), Accessories › Other accessories (3), Bags › Small bags & running belts (2), Accessories › Watches (2), Gear & lifestyle › Books & magazines (2), Footwear › Boots (1), Bottoms › Shell & rain pants (1), Gear & lifestyle › Other gear (1), Accessories › Hats & headbands (1), Outerwear › Down & insulated (1) |
| Satisfy | Accessory | Accessories › Other accessories (1) |
| Satisfy | Bandana | Accessories › Neck warmers, bandanas & balaclavas (20) |
| Satisfy | Belt | Bags › Small bags & running belts (3) |
| Satisfy | Cap | Accessories › Caps (31) |
| Satisfy | Flask | Accessories › Hydration (7) |
| Satisfy | Gloves | Accessories › Gloves & mittens (6) |
| Satisfy | Hat | Accessories › Beanies (2) |
| Satisfy | Jacket | Outerwear › Wind & rain jackets (16) |
| Satisfy | Magazine | Gear & lifestyle › Books & magazines (10) |
| Satisfy | Neck Warmer | Accessories › Neck warmers, bandanas & balaclavas (1) |
| Satisfy | Pants | Bottoms › Shell & rain pants (5), Bottoms › Pants (1) |
| Satisfy | Shoes | Footwear › Trail running (8), Footwear › Road running (6) |
| Satisfy | Shorts | Bottoms › Shorts (38), Bottoms › Tights & leggings (8) |
| Satisfy | Socks | Accessories › Socks (11) |
| Satisfy | Sunglasses | Accessories › Sunglasses & eyewear (14) |
| Satisfy | Sweatshirt | Mid layers › Hoodies & sweatshirts (8) |
| Satisfy | Top | Tops › T-shirts (67), Tops › Singlets & tanks (40), Tops › Long sleeve (33), Tops › Shirts (13), Mid layers › Fleece, knit & half-zips (9), Tops › Base layer tops (1), Mid layers › Hoodies & sweatshirts (1) |
| Satisfy | Vest | Accessories › Hydration (3) |
| Satisfy | repair | Gear & lifestyle › Knives & tools (1) |
| UVU | Caps | Accessories › Caps (1) |
| UVU | Hats | Accessories › Caps (6) |
| UVU | Hoodies | Mid layers › Hoodies & sweatshirts (4) |
| UVU | Outerwear | Outerwear › Wind & rain jackets (4) |
| UVU | Pants | Bottoms › Pants (1) |
| UVU | Shoes | Footwear › Slides & sandals (2) |
| UVU | Shorts | Bottoms › Shorts (13), Bottoms › Tights & leggings (9) |
| UVU | Socks | Accessories › Socks (7) |
| UVU | Sweatpant | Bottoms › Pants (2) |
| UVU | Sweatpants | Bottoms › Pants (2) |
| UVU | T-Shirts | Tops › T-shirts (7) |
| UVU | T-shirt | Tops › Long sleeve (13), Tops › T-shirts (11), Tops › Singlets & tanks (4), Mid layers › Fleece, knit & half-zips (3) |
| UVU | Vest | Tops › Singlets & tanks (15) |
| YMR Track Club | (none) | Accessories › Socks (21), Bottoms › Tights & leggings (18), Other › Other (9), Tops › Singlets & tanks (7), Mid layers › Hoodies & sweatshirts (7), Tops › T-shirts (7), Bottoms › Shorts (6), Mid layers › Fleece, knit & half-zips (4), Accessories › Sunglasses & eyewear (3), Accessories › Other accessories (2), Accessories › Supports, protection & anti-chafe (2), Accessories › Gloves & mittens (2), Outerwear › Other jackets (1) |
| YMR Track Club | Beanie | Accessories › Beanies (4), Accessories › Hats & headbands (1) |
| YMR Track Club | Cap | Accessories › Caps (7) |
| YMR Track Club | Gloves | Accessories › Gloves & mittens (2) |
| YMR Track Club | Headband | Accessories › Hats & headbands (5) |
| YMR Track Club | Hoodie | Mid layers › Hoodies & sweatshirts (5), Mid layers › Fleece, knit & half-zips (3) |
| YMR Track Club | Jacket | Mid layers › Fleece, knit & half-zips (2), Outerwear › Wind & rain jackets (2) |
| YMR Track Club | Long Sleeve | Tops › Long sleeve (9) |
| YMR Track Club | Scarf | Accessories › Neck warmers, bandanas & balaclavas (2) |
| YMR Track Club | Shorts | Bottoms › Shorts (8), Bottoms › Tights & leggings (2) |
| YMR Track Club | Singlet | Tops › Singlets & tanks (11) |
| YMR Track Club | Socks | Accessories › Socks (7) |
| YMR Track Club | Sweatshirt | Mid layers › Hoodies & sweatshirts (5) |
| YMR Track Club | T-shirt | Tops › T-shirts (9) |
| YMR Track Club | Tights | Bottoms › Tights & leggings (6) |
| YMR Track Club | Track Pants | Bottoms › Pants (4) |
| YMR Track Club | Underwear | Bottoms › Underwear (1) |
| YMR Track Club | Vest | Tops › Singlets & tanks (3) |
| YMR Track Club | Windbreaker | Outerwear › Wind & rain jackets (2) |
