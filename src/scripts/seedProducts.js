// script to insert products into the database

import ProductModel from "../models/product.js";
import mongoose from "mongoose";
import '../configs/loadEnv.js'

const insertProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

         await ProductModel.create(
//   [{
//     name: "Red Apple",
//     category: "fruits",
//     subcategory: "apple",
//     price: 120,
//     description: "Fresh, juicy red apples sourced from organic farms, perfect for a healthy snack or baking.",
//     tags: ["fruit", "apple", "healthy", "organic"],
//     images: ["apple1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Banana Bunch",
//     category: "fruits",
//     subcategory: "banana",
//     price: 60,
//     description: "Sweet and ripe bananas, packed with potassium, perfect for smoothies or snacking.",
//     tags: ["fruit", "banana", "healthy"],
//     images: ["banana1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Orange Juice Pack",
//     category: "fruits",
//     subcategory: "orange",
//     price: 150,
//     description: "Freshly squeezed oranges, rich in vitamin C, ideal for breakfast or refreshment.",
//     tags: ["fruit", "orange", "juice", "vitaminC"],
//     images: ["orange1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Grapes Green",
//     category: "fruits",
//     subcategory: "grape",
//     price: 200,
//     description: "Seedless green grapes, sweet and succulent, perfect for snacking or salads.",
//     tags: ["fruit", "grape", "snack"],
//     images: ["grape1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Strawberry Pack",
//     category: "fruits",
//     subcategory: "strawberry",
//     price: 250,
//     description: "Fresh strawberries, juicy and bright red, ideal for desserts and smoothies.",
//     tags: ["fruit", "strawberry", "fresh"],
//     images: ["strawberry1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Mango Alphonso",
//     category: "fruits",
//     subcategory: "mango",
//     price: 300,
//     description: "Sweet and aromatic Alphonso mangoes, perfect for summer desserts and smoothies.",
//     tags: ["fruit", "mango", "summer", "sweet"],
//     images: ["mango1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Pineapple Slice Pack",
//     category: "fruits",
//     subcategory: "pineapple",
//     price: 180,
//     description: "Tropical pineapple slices, sweet and tangy, great for snacks or desserts.",
//     tags: ["fruit", "pineapple", "tropical"],
//     images: ["pineapple1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Potato Bag",
//     category: "vegetables",
//     subcategory: "potato",
//     price: 40,
//     description: "Fresh potatoes, perfect for boiling, baking, or frying, sourced from local farms.",
//     tags: ["vegetable", "potato", "staple"],
//     images: ["potato1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Onion Bundle",
//     category: "vegetables",
//     subcategory: "onion",
//     price: 30,
//     description: "Fresh and flavorful onions, ideal for cooking and adding taste to any dish.",
//     tags: ["vegetable", "onion", "cooking"],
//     images: ["onion1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Tomato Pack",
//     category: "vegetables",
//     subcategory: "tomato",
//     price: 50,
//     description: "Red and juicy tomatoes, perfect for salads, sauces, and cooking.",
//     tags: ["vegetable", "tomato", "fresh"],
//     images: ["tomato1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Carrot Pack",
//     category: "vegetables",
//     subcategory: "carrot",
//     price: 70,
//     description: "Organic carrots, rich in vitamin A, perfect for salads, cooking, or juicing.",
//     tags: ["vegetable", "carrot", "healthy"],
//     images: ["carrot1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Broccoli Florets",
//     category: "vegetables",
//     subcategory: "broccoli",
//     price: 120,
//     description: "Fresh green broccoli florets, rich in fiber and vitamins, perfect for steaming or salads.",
//     tags: ["vegetable", "broccoli", "healthy"],
//     images: ["broccoli1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Spinach Bundle",
//     category: "vegetables",
//     subcategory: "spinach",
//     price: 60,
//     description: "Fresh spinach leaves, packed with iron and vitamins, great for cooking or salads.",
//     tags: ["vegetable", "spinach", "healthy"],
//     images: ["spinach1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Cauliflower Head",
//     category: "vegetables",
//     subcategory: "cauliflower",
//     price: 90,
//     description: "Fresh white cauliflower, perfect for roasting, cooking, or making healthy dishes.",
//     tags: ["vegetable", "cauliflower", "fresh"],
//     images: ["cauliflower1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Cucumber Pack",
//     category: "vegetables",
//     subcategory: "cucumber",
//     price: 50,
//     description: "Fresh cucumbers, crisp and hydrating, ideal for salads and refreshing snacks.",
//     tags: ["vegetable", "cucumber", "fresh"],
//     images: ["cucumber1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Bath Soap Bar",
//     category: "personal_care",
//     subcategory: "soap",
//     price: 35,
//     description: "Gentle and fragrant soap bar, keeps skin soft and refreshed after every wash.",
//     tags: ["personal_care", "soap", "cleaning"],
//     images: ["soap1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Mint Toothpaste",
//     category: "personal_care",
//     subcategory: "toothpaste",
//     price: 60,
//     description: "Fluoride toothpaste with fresh mint flavor, helps fight cavities and maintain oral hygiene.",
//     tags: ["personal_care", "toothpaste", "oral_hygiene"],
//     images: ["toothpaste1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Soft Toothbrush",
//     category: "personal_care",
//     subcategory: "toothbrush",
//     price: 25,
//     description: "Soft-bristled toothbrush, gentle on gums and effective in cleaning teeth.",
//     tags: ["personal_care", "toothbrush", "oral_hygiene"],
//     images: ["toothbrush1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Shampoo Classic",
//     category: "personal_care",
//     subcategory: "shampoo",
//     price: 120,
//     description: "Refreshing shampoo for daily hair care, keeps hair clean, soft, and manageable.",
//     tags: ["personal_care", "shampoo", "haircare"],
//     images: ["shampoo1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Body Lotion",
//     category: "personal_care",
//     subcategory: "lotion",
//     price: 180,
//     description: "Moisturizing body lotion, keeps skin hydrated and smooth throughout the day.",
//     tags: ["personal_care", "lotion", "skin_care"],
//     images: ["lotion1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Conditioner Smooth",
//     category: "personal_care",
//     subcategory: "conditioner",
//     price: 140,
//     description: "Hair conditioner for silky and manageable hair, ideal for all hair types.",
//     tags: ["personal_care", "conditioner", "haircare"],
//     images: ["conditioner1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Body Wash Refresh",
//     category: "personal_care",
//     subcategory: "body_wash",
//     price: 160,
//     description: "Refreshing body wash, keeps skin clean and fragrant after every shower.",
//     tags: ["personal_care", "body_wash", "cleaning"],
//     images: ["bodywash1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Sunscreen SPF 50",
//     category: "personal_care",
//     subcategory: "sunscreen",
//     price: 350,
//     description: "High protection sunscreen lotion, shields skin from harmful UV rays effectively.",
//     tags: ["personal_care", "sunscreen", "skin_protection"],
//     images: ["sunscreen1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Detergent Powder",
//     category: "household_essentials",
//     subcategory: "detergent",
//     price: 200,
//     description: "High-quality detergent powder, effectively removes stains and keeps clothes fresh.",
//     tags: ["household", "detergent", "cleaning"],
//     images: ["detergent1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Tissue Box",
//     category: "household_essentials",
//     subcategory: "tissue",
//     price: 40,
//     description: "Soft and absorbent tissue, ideal for everyday use at home or office.",
//     tags: ["household", "tissue", "essential"],
//     images: ["tissue1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Air Freshener Spray",
//     category: "household_essentials",
//     subcategory: "air_freshener",
//     price: 120,
//     description: "Refreshing air freshener spray, eliminates odors and keeps your home smelling pleasant.",
//     tags: ["household", "air_freshener", "fresh"],
//     images: ["airfreshener1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Glass Cleaner",
//     category: "household_essentials",
//     subcategory: "glass_cleaner",
//     price: 150,
//     description: "Effective glass cleaner, leaves windows and mirrors sparkling clean without streaks.",
//     tags: ["household", "glass_cleaner", "cleaning"],
//     images: ["glasscleaner1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Bathroom Cleaner",
//     category: "household_essentials",
//     subcategory: "bathroom_cleaner",
//     price: 170,
//     description: "Powerful bathroom cleaner, removes tough stains and keeps your bathroom hygienic.",
//     tags: ["household", "bathroom_cleaner", "cleaning"],
//     images: ["bathroomcleaner1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Surface Cleaner",
//     category: "household_essentials",
//     subcategory: "surface_cleaner",
//     price: 140,
//     description: "Multi-surface cleaner, effectively cleans and sanitizes various surfaces at home.",
//     tags: ["household", "surface_cleaner", "cleaning"],
//     images: ["surfacecleaner1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Whole Milk",
//     category: "dairy_and_breads",
//     subcategory: "milk",
//     price: 60,
//     description: "Fresh whole milk, rich in calcium and essential nutrients, perfect for daily consumption.",
//     tags: ["dairy", "milk", "fresh"],
//     images: ["milk1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Butter Block",
//     category: "dairy_and_breads",
//     subcategory: "butter",
//     price: 250,
//     description: "Creamy and smooth butter, ideal for cooking, baking, or spreading on bread.",
//     tags: ["dairy", "butter", "cooking"],
//     images: ["butter1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Paneer Cubes",
//     category: "dairy_and_breads",
//     subcategory: "paneer",
//     price: 300,
//     description: "Fresh cottage cheese (paneer) cubes, perfect for cooking Indian dishes or salads.",
//     tags: ["dairy", "paneer", "cooking"],
//     images: ["paneer1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Fresh Cream",
//     category: "dairy_and_breads",
//     subcategory: "cream",
//     price: 150,
//     description: "Rich and creamy dairy cream, ideal for desserts, sauces, and beverages.",
//     tags: ["dairy", "cream", "desserts"],
//     images: ["cream1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Desi Ghee",
//     category: "dairy_and_breads",
//     subcategory: "desi_ghee",
//     price: 400,
//     description: "Pure and aromatic desi ghee, perfect for cooking traditional Indian dishes.",
//     tags: ["dairy", "ghee", "cooking"],
//     images: ["ghee1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "White Bread Loaf",
//     category: "dairy_and_breads",
//     subcategory: "white_bread",
//     price: 50,
//     description: "Soft and fresh white bread loaf, perfect for sandwiches and toasts.",
//     tags: ["bread", "white_bread", "bakery"],
//     images: ["whitebread1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Brown Bread Loaf",
//     category: "dairy_and_breads",
//     subcategory: "brown_bread",
//     price: 60,
//     description: "Healthy brown bread loaf, ideal for sandwiches and breakfast toast.",
//     tags: ["bread", "brown_bread", "healthy"],
//     images: ["brownbread1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Multigrain Bread Loaf",
//     category: "dairy_and_breads",
//     subcategory: "multigrain_bread",
//     price: 70,
//     description: "Nutritious multigrain bread loaf, packed with seeds and fibers for a healthy diet.",
//     tags: ["bread", "multigrain_bread", "healthy"],
//     images: ["multigrain1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Orange Juice",
//     category: "beverages",
//     subcategory: "juice",
//     price: 120,
//     description: "Freshly squeezed orange juice, packed with vitamins, perfect for a refreshing drink.",
//     tags: ["beverage", "juice", "fresh"],
//     images: ["juice1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Carbonated Soda",
//     category: "beverages",
//     subcategory: "soda",
//     price: 50,
//     description: "Chilled soda, fizzy and refreshing, perfect for parties or casual drinking.",
//     tags: ["beverage", "soda", "refreshing"],
//     images: ["soda1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Green Tea Pack",
//     category: "beverages",
//     subcategory: "tea",
//     price: 150,
//     description: "Premium green tea leaves, full of antioxidants, ideal for a healthy beverage.",
//     tags: ["beverage", "tea", "healthy"],
//     images: ["tea1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Instant Coffee",
//     category: "beverages",
//     subcategory: "coffee",
//     price: 200,
//     description: "Rich instant coffee, perfect for a quick energizing drink anytime.",
//     tags: ["beverage", "coffee", "instant"],
//     images: ["coffee1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Mineral Water",
//     category: "beverages",
//     subcategory: "water",
//     price: 20,
//     description: "Pure mineral water, hygienic and refreshing, ideal for daily hydration.",
//     tags: ["beverage", "water", "refreshing"],
//     images: ["water1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Soft Drink Cola",
//     category: "beverages",
//     subcategory: "soft_drink",
//     price: 50,
//     description: "Chilled cola soft drink, fizzy and refreshing, perfect for parties or casual drinks.",
//     tags: ["beverage", "soft_drink", "refreshing"],
//     images: ["softdrink1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Energy Drink Pack",
//     category: "beverages",
//     subcategory: "energy_drink",
//     price: 180,
//     description: "High-energy drink, provides instant refreshment and vitality during workouts or long hours.",
//     tags: ["beverage", "energy_drink", "refreshing"],
//     images: ["energydrink1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Chocolate Milkshake",
//     category: "beverages",
//     subcategory: "milkshake",
//     price: 150,
//     description: "Delicious chocolate milkshake, creamy and sweet, perfect for dessert or snack.",
//     tags: ["beverage", "milkshake", "chocolate"],
//     images: ["milkshake1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Potato Chips Pack",
//     category: "snacks",
//     subcategory: "chips",
//     price: 50,
//     description: "Crunchy potato chips, salted and perfect for a quick snack or party.",
//     tags: ["snack", "chips", "crispy"],
//     images: ["chips1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Instant Noodles",
//     category: "snacks",
//     subcategory: "noodles",
//     price: 40,
//     description: "Quick-cook instant noodles, tasty and easy to prepare for a fast meal.",
//     tags: ["snack", "noodles", "quick_meal"],
//     images: ["noodles1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Butter Cookies",
//     category: "snacks",
//     subcategory: "cookies",
//     price: 70,
//     description: "Delicious butter cookies, crisp and sweet, ideal for tea-time or snacks.",
//     tags: ["snack", "cookies", "sweet"],
//     images: ["cookies1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Butter Popcorn",
//     category: "snacks",
//     subcategory: "popcorn",
//     price: 60,
//     description: "Freshly popped buttered popcorn, perfect for movies or snacking at home.",
//     tags: ["snack", "popcorn", "butter"],
//     images: ["popcorn1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Assorted Biscuits",
//     category: "snacks",
//     subcategory: "biscuits",
//     price: 80,
//     description: "Assorted biscuits pack, delicious and crunchy, ideal for tea-time or quick snacks.",
//     tags: ["snack", "biscuits", "assorted"],
//     images: ["biscuits1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Mixed Nuts Pack",
//     category: "snacks",
//     subcategory: "nuts",
//     price: 200,
//     description: "Healthy and crunchy mixed nuts, perfect for snacking or adding to dishes.",
//     tags: ["snack", "nuts", "healthy"],
//     images: ["nuts1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Chocolate Bar",
//     category: "snacks",
//     subcategory: "chocolates",
//     price: 100,
//     description: "Delicious chocolate bar, rich in cocoa, perfect for dessert or gifting.",
//     tags: ["snack", "chocolate", "sweet"],
//     images: ["chocolate1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Namkeen Mixture",
//     category: "snacks",
//     subcategory: "namkeen",
//     price: 90,
//     description: "Savory Indian namkeen mixture, crunchy and spicy, perfect for snacking.",
//     tags: ["snack", "namkeen", "spicy"],
//     images: ["namkeen1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Hand Sanitizer",
//     category: "health_and_wellness",
//     subcategory: "sanitizer_and_disinfectant",
//     price: 120,
//     description: "Alcohol-based hand sanitizer, kills 99.9% of germs and keeps hands clean.",
//     tags: ["health", "sanitizer", "clean"],
//     images: ["sanitizer1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Vitamin C Tablets",
//     category: "health_and_wellness",
//     subcategory: "vitamin_and_supplement",
//     price: 300,
//     description: "Vitamin C tablets for daily immunity boost, essential for overall health.",
//     tags: ["health", "vitamin", "supplement"],
//     images: ["vitamin1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   },
//   {
//     name: "Whey Protein Powder",
//     category: "health_and_wellness",
//     subcategory: "protein_powder",
//     price: 1500,
//     description: "High-quality whey protein powder, helps in muscle building and recovery.",
//     tags: ["health", "protein", "fitness"],
//     images: ["protein1.jpg"],
//     warehouses: [{ warehouse: new mongoose.Types.ObjectId("69176f6564ed1aba8c7a67cb"), quantity: 60 }]
//   }]
);

        console.log('Script executed. No errors found.');
        console.log('Products inserted successfully!');
    } catch (err) {
        console.error('Script failed to execute');
        console.error('Error inserting products:', err);
    } finally { 
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
insertProducts()
