# Master taxonomy

Every store category is mapped onto this tree (department › subcategory).
Gender, function (insulated, windproof, water-resistant, reflective) and material are separate filters, not categories.
Rules live in `scripts/lib/taxonomy.mjs`; products the rules can only guess are classified by Claude (`data/ai-categories.json`).

## Tops

- **T-shirts** `tops/t-shirts` · 536 products
- **Long sleeve** `tops/long-sleeve` · 187 products
- **Singlets & tanks** `tops/singlets` · 221 products
- **Shirts** `tops/shirts` · 67 products
- **Sports bras** `tops/sports-bras` · 36 products
- **Base layer tops** `tops/base-layers` · 41 products

## Mid layers

- **Fleece, knit & half-zips** `midlayers/fleece-knit` · 119 products
- **Hoodies & sweatshirts** `midlayers/hoodies` · 96 products

## Outerwear

- **Wind & rain jackets** `outerwear/wind-rain` · 249 products
- **Shell jackets** `outerwear/shell` · 52 products
- **Down & insulated** `outerwear/insulated` · 103 products
- **Vests & gilets** `outerwear/vests` · 36 products
- **Other jackets** `outerwear/jackets` · 3 products

## Bottoms

- **Shorts** `bottoms/shorts` · 364 products
- **Tights & leggings** `bottoms/tights` · 179 products
- **Pants** `bottoms/pants` · 151 products
- **Shell & rain pants** `bottoms/shell-pants` · 27 products
- **Skirts** `bottoms/skirts` · 3 products
- **Base layer bottoms** `bottoms/base-layers` · 0 products
- **Underwear** `bottoms/underwear` · 9 products

## Footwear

- **Road running** `footwear/road-running` · 1249 products
- **Trail running** `footwear/trail-running` · 277 products
- **Hiking** `footwear/hiking` · 43 products
- **Boots** `footwear/boots` · 21 products
- **Casual & lifestyle** `footwear/casual` · 192 products
- **Slides & sandals** `footwear/slides-sandals` · 38 products
- **Court & tennis** `footwear/court` · 3 products
- **Other footwear** `footwear/other` · 0 products

## Accessories

- **Caps** `accessories/caps` · 192 products
- **Beanies** `accessories/beanies` · 87 products
- **Hats & headbands** `accessories/hats` · 39 products
- **Neck warmers, bandanas & balaclavas** `accessories/neckwear` · 57 products
- **Gloves & mittens** `accessories/gloves` · 53 products
- **Socks** `accessories/socks` · 217 products
- **Sunglasses & eyewear** `accessories/sunglasses` · 87 products
- **Watches** `accessories/watches` · 134 products
- **Hydration** `accessories/hydration` · 65 products
- **Headlamps & running lights** `accessories/lights` · 38 products
- **Insoles & shoe care** `accessories/insoles-care` · 48 products
- **Supports, protection & anti-chafe** `accessories/protection` · 37 products
- **Other accessories** `accessories/other` · 34 products

## Bags

- **Backpacks** `bags/backpacks` · 69 products
- **Duffels & totes** `bags/duffels-totes` · 51 products
- **Small bags & running belts** `bags/small-bags` · 77 products

## Gear & lifestyle _(hidden by default)_

- **Cooking** `gear/cooking` · 11 products
- **Knives & tools** `gear/knives-tools` · 7 products
- **Camping & sleeping** `gear/camping` · 6 products
- **Climbing** `gear/climbing` · 4 products
- **Furniture** `gear/furniture` · 15 products
- **Lighting** `gear/lighting` · 1 products
- **Books & magazines** `gear/books-media` · 15 products
- **Sports nutrition** `gear/nutrition` · 99 products
- **Fitness equipment** `gear/fitness` · 56 products
- **Headphones & electronics** `gear/electronics` · 27 products
- **Other gear** `gear/other` · 2 products

## Store category mapping

| Store | Store category | Mapped to |
|---|---|---|
| KA-YO | BH:ar | Tops › Sports bras (15), Tops › Singlets & tanks (2) |
| KA-YO | Balaklava | Accessories › Neck warmers, bandanas & balaclavas (3) |
| KA-YO | Belysning | Gear & lifestyle › Lighting (1) |
| KA-YO | Bucket Hats | Accessories › Hats & headbands (5) |
| KA-YO | Climb | Accessories › Other accessories (1) |
| KA-YO | Dam Byxor | Bottoms › Pants (16) |
| KA-YO | Dam Dunjackor | Outerwear › Down & insulated (9) |
| KA-YO | Dam Fleece & Stickat | Mid layers › Fleece, knit & half-zips (14), Mid layers › Hoodies & sweatshirts (2) |
| KA-YO | Dam Linnen | Tops › Singlets & tanks (33) |
| KA-YO | Dam Longsleeve T-shirts | Tops › Long sleeve (23) |
| KA-YO | Dam Lättviktsdunjackor | Outerwear › Down & insulated (5) |
| KA-YO | Dam Löparkläder | Accessories › Other accessories (1) |
| KA-YO | Dam Löparskor | Footwear › Road running (103), Footwear › Trail running (1) |
| KA-YO | Dam Shorts & Kjolar | Bottoms › Shorts (43), Bottoms › Tights & leggings (1) |
| KA-YO | Dam Skalbyxor | Bottoms › Shell & rain pants (5) |
| KA-YO | Dam Skaljackor | Outerwear › Shell jackets (8) |
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
| KA-YO | Herr Lättviktsdunjackor | Outerwear › Down & insulated (31) |
| KA-YO | Herr Löparkläder | Bottoms › Pants (1) |
| KA-YO | Herr Löparskor | Footwear › Road running (121), Footwear › Trail running (4) |
| KA-YO | Herr Shorts | Bottoms › Shorts (98), Bottoms › Tights & leggings (2) |
| KA-YO | Herr Skaljackor | Outerwear › Shell jackets (41), Outerwear › Wind & rain jackets (5), Outerwear › Down & insulated (1) |
| KA-YO | Herr Strumpor | Accessories › Socks (26) |
| KA-YO | Herr T-shirts | Tops › T-shirts (190), Tops › Shirts (5), Mid layers › Fleece, knit & half-zips (3), Bottoms › Shorts (2), Tops › Singlets & tanks (2), Tops › Base layer tops (1), Mid layers › Hoodies & sweatshirts (1) |
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
| Löplabbet | Kläder/T-shirt & Toppar | Tops › T-shirts (77), Tops › Long sleeve (25), Footwear › Road running (13), Mid layers › Fleece, knit & half-zips (9), Mid layers › Hoodies & sweatshirts (6), Tops › Shirts (2), Bottoms › Shorts (1) |
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
| Löplabbet | Löparskor/Tempo | Footwear › Road running (162), Footwear › Trail running (1) |
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
| Löplabbet | Tillbehör/Presentkort | Gear & lifestyle › Other gear (1) |
| Löplabbet | Tillbehör/Ryggsäckar & Vätskesystem | Bags › Backpacks (23) |
| Löplabbet | Tillbehör/Sko och klädvård | Accessories › Insoles & shoe care (8) |
| Löplabbet | Tillbehör/Skydd | Accessories › Supports, protection & anti-chafe (25) |
| Löplabbet | Tillbehör/Sulor | Accessories › Insoles & shoe care (12) |
| Löplabbet | Tillbehör/Träningsredskap | Gear & lifestyle › Fitness equipment (49) |
| Löplabbet | Tillbehör/Övriga accessoarer | Accessories › Other accessories (21), Accessories › Insoles & shoe care (8), Gear & lifestyle › Fitness equipment (4), Accessories › Neck warmers, bandanas & balaclavas (2), Accessories › Hats & headbands (1) |
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
