import { productImage, productFallback, categoryImage, categoryFallback, bannerImage, bannerFallback } from "./images";

export const FREE_DELIVERY_LIMIT = 1000;
export const SUBSCRIBE_PCT = 5; // "Subscribe & save" discount (%)
// Single place the UI reads its business rules from. With a real API these come from the backend (see services/).
export const CONFIG = { freeDeliveryLimit: FREE_DELIVERY_LIMIT, subscribePct: SUBSCRIBE_PCT, leadHours: 1 };

// express: Express delivery offered here | courier: no time slots, delivered by courier in `eta`
export const AREAS = [
  { id: "sylhet", name: "Inside Sylhet City", charge: 50, express: true, expressCharge: 60, courier: false },
  { id: "dhaka", name: "Inside Dhaka City", charge: 60, express: true, expressCharge: 60, courier: false },
  { id: "dhaka-sub", name: "Dhaka Suburbs (Savar, Gazipur, Narayanganj)", charge: 80, express: false, expressCharge: 0, courier: false },
  { id: "all-bd", name: "Outside Dhaka / All Bangladesh (Courier)", charge: 120, express: false, expressCharge: 0, courier: true, eta: "2–4 days" },
];

// startHour = 24h clock. `disabled` = fully booked (comes from the backend). Slots that already started are disabled in lib/delivery.js
export const SLOTS = [
  { id: "s1", label: "9 – 11 AM", startHour: 9, disabled: true },
  { id: "s2", label: "11 AM – 1 PM", startHour: 11 },
  { id: "s3", label: "4 – 6 PM", startHour: 16 },
  { id: "s4", label: "6 – 8 PM", startHour: 18 },
];

export const PAYMENTS = ["Cash on Delivery", "bKash", "Nagad", "Card"];
export const STATUS_LABEL = { fresh: "Fresh Today", low: "Only 3 Left", near: "Near Expiry", out: "Out of Stock" };

// Colour palette used by the illustrated product art
const C = {
  red: "#e5484d", orange: "#f08c3a", yellow: "#f2bf2c", green: "#4fa86b", dgreen: "#2f6b45", lime: "#9acd4f",
  purple: "#7b4fa3", pink: "#ef7fa5", brown: "#8b5a3c", tan: "#d9b38c", cream: "#e8d5aa", blue: "#4a8fe0",
  navy: "#2f4b7c", teal: "#2aa8a0", white: "#c9d6dc", gray: "#8a96a0", gold: "#d4a24c", choco: "#5a3825", coral: "#f2735c", mango: "#f6a21e",
};

// [id, name, subs, art kind, art colour, products[]]
// product row: [name, brand, sub, price, mrp, art kind, art colour, unit?, status?]
const CATALOG = [
  ["veg", "Vegetables", ["Leafy", "Roots", "Everyday"], "leaf", "green", [
    ["Tomato", "Fresh Farm", "Everyday", 60, 75, "fruit", "red", "kg", "fresh"],
    ["Spinach Bunch", "Fresh Farm", "Leafy", 30, 35, "leaf", "green"],
    ["Carrot", "Green Roots", "Roots", 80, 100, "long", "orange", "kg"],
    ["Potato", "Green Roots", "Roots", 45, 50, "fruit", "tan", "kg", "low"],
    ["Cucumber", "Fresh Farm", "Everyday", 50, 65, "long", "lime", "kg"],
    ["Brinjal", "Green Roots", "Everyday", 70, 90, "long", "purple", "kg"],
    ["Green Chili", "Fresh Farm", "Everyday", 120, 150, "long", "dgreen", "kg"],
    ["Red Onion", "Green Roots", "Roots", 75, 95, "fruit", "purple", "kg"],
    ["Cauliflower", "Fresh Farm", "Everyday", 55, 70, "cluster", "cream"],
    ["Sweet Pumpkin", "Green Roots", "Everyday", 40, 55, "fruit", "orange", "kg"]]],
  ["fruits", "Fruits", ["Seasonal", "Tropical"], "fruit", "red", [
    ["Banana (dozen)", "Orchard", "Tropical", 70, 90, "banana", "yellow"],
    ["Apple", "Orchard", "Seasonal", 240, 300, "fruit", "red", "kg", "near"],
    ["Mango", "Orchard", "Seasonal", 180, 240, "fruit", "mango", "kg", "fresh"],
    ["Orange", "Orchard", "Seasonal", 200, 260, "fruit", "orange", "kg"],
    ["Black Grapes", "Orchard", "Seasonal", 320, 400, "cluster", "purple", "kg"],
    ["Papaya", "Orchard", "Tropical", 90, 120, "long", "orange", "kg", "low"],
    ["Pomegranate", "Orchard", "Seasonal", 380, 460, "fruit", "coral", "kg"],
    ["Watermelon", "Orchard", "Tropical", 45, 60, "slice", "red", "kg"],
    ["Green Guava", "Orchard", "Tropical", 110, 140, "fruit", "lime", "kg"],
    ["Litchi", "Orchard", "Seasonal", 260, 320, "cluster", "pink", "kg"]]],
  ["meat", "Meat & Fish", ["Chicken", "Beef & Mutton", "Fish"], "meat", "coral", [
    ["Broiler Chicken", "Farm Fresh Meats", "Chicken", 260, 300, "meat", "gold", "kg", "fresh"],
    ["Chicken Breast", "Farm Fresh Meats", "Chicken", 340, 390, "meat", "tan", "kg"],
    ["Chicken Wings", "Farm Fresh Meats", "Chicken", 300, 360, "meat", "orange", "kg"],
    ["Beef (boneless)", "Farm Fresh Meats", "Beef & Mutton", 780, 850, "meat", "red", "kg"],
    ["Beef Mince", "Farm Fresh Meats", "Beef & Mutton", 720, 800, "meat", "coral", "kg"],
    ["Mutton", "Farm Fresh Meats", "Beef & Mutton", 1250, 1400, "meat", "brown", "kg"],
    ["Rohu Fish", "Sea Catch", "Fish", 380, 450, "fish", "teal", "kg", "fresh"],
    ["Hilsa (Ilish)", "Sea Catch", "Fish", 1600, 1900, "fish", "blue", "kg"],
    ["Prawn", "Sea Catch", "Fish", 900, 1100, "shrimp", "coral", "kg", "low"],
    ["Tilapia Fish", "Sea Catch", "Fish", 240, 290, "fish", "gray", "kg"]]],
  ["dairy", "Dairy & Eggs", ["Milk", "Eggs", "Cheese & Butter"], "carton", "blue", [
    ["Fresh Milk 1L", "Dairy Pure", "Milk", 95, 100, "carton", "blue", "pc", "low"],
    ["Plain Yogurt 500g", "Dairy Pure", "Milk", 120, 140, "tub", "white"],
    ["Fresh Cream 200ml", "Dairy Pure", "Milk", 190, 230, "carton", "cream"],
    ["Condensed Milk", "Dairy Pure", "Milk", 150, 180, "can", "blue"],
    ["Farm Eggs (12)", "Dairy Pure", "Eggs", 150, 170, "egg", "cream"],
    ["Brown Eggs (6)", "Dairy Pure", "Eggs", 90, 110, "egg", "tan", "pc", "fresh"],
    ["Salted Butter 200g", "Dairy Pure", "Cheese & Butter", 260, 300, "box", "yellow"],
    ["Cheese Slices", "Dairy Pure", "Cheese & Butter", 320, 380, "box", "orange"],
    ["Paneer 250g", "Dairy Pure", "Cheese & Butter", 280, 330, "box", "cream"],
    ["Pure Ghee 500g", "Dairy Pure", "Cheese & Butter", 780, 900, "jar", "gold"]]],
  ["bakery", "Bakery", ["Bread", "Cakes & Treats"], "bread", "tan", [
    ["Sandwich Bread", "Daily Bake", "Bread", 70, 80, "bread", "tan", "pc", "fresh"],
    ["Brown Bread", "Daily Bake", "Bread", 85, 100, "bread", "brown"],
    ["Croissant (4)", "Daily Bake", "Bread", 180, 220, "bread", "gold", "pc", "fresh"],
    ["Burger Buns (6)", "Daily Bake", "Bread", 90, 110, "bread", "orange"],
    ["French Baguette", "Daily Bake", "Bread", 110, 130, "bread", "tan"],
    ["Chocolate Cake", "Daily Bake", "Cakes & Treats", 650, 800, "cake", "choco"],
    ["Vanilla Cupcakes (4)", "Daily Bake", "Cakes & Treats", 260, 320, "cake", "pink"],
    ["Blueberry Muffins (6)", "Daily Bake", "Cakes & Treats", 300, 380, "cake", "purple"],
    ["Glazed Donuts (4)", "Daily Bake", "Cakes & Treats", 240, 290, "cookie", "pink"],
    ["Butter Cookies 300g", "Daily Bake", "Cakes & Treats", 160, 200, "cookie", "gold"]]],
  ["snacks", "Snacks", ["Chips", "Nuts & Dried"], "bag", "yellow", [
    ["Potato Chips 150g", "Crispy", "Chips", 50, 70, "bag", "yellow"],
    ["Cheese Crackers", "Crispy", "Chips", 90, 120, "bag", "orange", "pc", "out"],
    ["Nacho Chips 200g", "Crispy", "Chips", 110, 140, "bag", "red"],
    ["Butter Popcorn", "Crispy", "Chips", 60, 80, "bag", "gold"],
    ["Rice Crisps", "Crispy", "Chips", 45, 60, "bag", "teal"],
    ["Whole Cashews 250g", "Nut House", "Nuts & Dried", 420, 600, "bag", "tan"],
    ["Roasted Almonds 250g", "Nut House", "Nuts & Dried", 480, 650, "bag", "brown"],
    ["Pistachios 200g", "Nut House", "Nuts & Dried", 520, 700, "bag", "green", "pc", "low"],
    ["Raisins 250g", "Nut House", "Nuts & Dried", 260, 340, "bag", "purple"],
    ["Medjool Dates 500g", "Nut House", "Nuts & Dried", 650, 800, "box", "choco"]]],
  ["drinks", "Beverages", ["Juice", "Tea & Coffee", "Soft Drinks"], "bottle", "orange", [
    ["Orange Juice 1L", "Sip Co", "Juice", 180, 220, "carton", "orange"],
    ["Mango Juice 1L", "Sip Co", "Juice", 170, 210, "carton", "yellow"],
    ["Coconut Water", "Sip Co", "Juice", 80, 100, "carton", "lime", "pc", "fresh"],
    ["Green Tea (25 bags)", "Sip Co", "Tea & Coffee", 220, 280, "box", "green"],
    ["Black Tea 400g", "Sip Co", "Tea & Coffee", 240, 290, "box", "choco"],
    ["Ground Coffee 250g", "Sip Co", "Tea & Coffee", 550, 700, "bag", "brown"],
    ["Instant Coffee Cup", "Sip Co", "Tea & Coffee", 90, 120, "cup", "brown"],
    ["Cola 1.25L", "Sip Co", "Soft Drinks", 85, 100, "bottle", "red"],
    ["Lemon Soda 500ml", "Sip Co", "Soft Drinks", 45, 60, "bottle", "lime"],
    ["Mineral Water 2L", "Sip Co", "Soft Drinks", 40, 45, "bottle", "blue"]]],
  ["pantry", "Pantry", ["Oils", "Honey & Spreads", "Basics"], "jar", "gold", [
    ["Olive Oil 500ml", "Bertolli", "Oils", 850, 1200, "bottle", "lime"],
    ["Mustard Oil 1L", "Bertolli", "Oils", 320, 380, "bottle", "yellow"],
    ["Soybean Oil 2L", "Bertolli", "Oils", 380, 430, "bottle", "gold"],
    ["Forest Honey 500g", "Sundarban", "Honey & Spreads", 550, 650, "jar", "gold", "pc", "fresh"],
    ["Peanut Butter 340g", "Sundarban", "Honey & Spreads", 380, 450, "jar", "tan"],
    ["Strawberry Jam", "Sundarban", "Honey & Spreads", 210, 260, "jar", "red"],
    ["Sea Salt 500g", "Sundarban", "Basics", 60, 75, "box", "white"],
    ["Refined Sugar 1kg", "Sundarban", "Basics", 125, 140, "bag", "white"],
    ["Tomato Ketchup", "Sundarban", "Basics", 140, 170, "bottle", "red"],
    ["White Vinegar", "Sundarban", "Basics", 70, 90, "bottle", "gray"]]],
  ["grains", "Rice & Grains", ["Rice & Flour", "Lentils & Pulses"], "sack", "tan", [
    ["Basmati Rice 5kg", "Golden Grain", "Rice & Flour", 950, 1100, "sack", "cream"],
    ["Miniket Rice 5kg", "Golden Grain", "Rice & Flour", 420, 480, "sack", "tan"],
    ["Whole Wheat Flour 2kg", "Golden Grain", "Rice & Flour", 150, 175, "bag", "brown"],
    ["Maida 2kg", "Golden Grain", "Rice & Flour", 130, 150, "bag", "white"],
    ["Oats 500g", "Golden Grain", "Rice & Flour", 220, 270, "box", "gold"],
    ["Flattened Rice 1kg", "Golden Grain", "Rice & Flour", 110, 130, "bag", "cream"],
    ["Red Lentils 1kg", "Golden Grain", "Lentils & Pulses", 140, 165, "bag", "orange"],
    ["Chickpeas 1kg", "Golden Grain", "Lentils & Pulses", 160, 190, "bag", "tan"],
    ["Mung Dal 1kg", "Golden Grain", "Lentils & Pulses", 170, 200, "bag", "yellow"],
    ["Black Lentils 1kg", "Golden Grain", "Lentils & Pulses", 150, 180, "bag", "choco"]]],
  ["frozen", "Frozen Food", ["Meals", "Ice Cream"], "tub", "blue", [
    ["Frozen Peas 500g", "Frosty", "Meals", 110, 140, "bag", "green"],
    ["Sweet Corn 500g", "Frosty", "Meals", 120, 150, "bag", "yellow"],
    ["Chicken Nuggets", "Frosty", "Meals", 380, 450, "box", "orange"],
    ["French Fries 1kg", "Frosty", "Meals", 290, 350, "bag", "gold"],
    ["Frozen Parata (10)", "Frosty", "Meals", 230, 280, "bag", "tan"],
    ["Beef Seekh Kebab", "Frosty", "Meals", 450, 520, "box", "red"],
    ["Vegetable Samosa", "Frosty", "Meals", 210, 260, "box", "lime"],
    ["Vanilla Ice Cream 1L", "Frosty", "Ice Cream", 420, 520, "tub", "cream"],
    ["Chocolate Ice Cream", "Frosty", "Ice Cream", 450, 550, "tub", "choco", "pc", "low"],
    ["Mango Kulfi (6)", "Frosty", "Ice Cream", 260, 320, "box", "orange"]]],
  ["beauty", "Beauty & Care", ["Skin", "Hair & Body"], "tube", "pink", [
    ["Face Serum", "SCA", "Skin", 1200, 2400, "bottle", "gold"],
    ["Sunscreen SPF50", "SCA", "Skin", 750, 1100, "tube", "yellow"],
    ["Face Wash", "SCA", "Skin", 320, 480, "tube", "teal"],
    ["Clay Face Mask", "SCA", "Skin", 480, 720, "jar", "green"],
    ["Lip Balm", "SCA", "Skin", 180, 260, "tube", "pink"],
    ["Body Cream", "SCA", "Hair & Body", 900, 1800, "jar", "pink"],
    ["Shampoo 400ml", "SCA", "Hair & Body", 420, 620, "pump", "purple"],
    ["Conditioner 400ml", "SCA", "Hair & Body", 440, 640, "pump", "coral"],
    ["Hair Oil 200ml", "SCA", "Hair & Body", 260, 380, "bottle", "choco"],
    ["Eau de Parfum", "SCA", "Hair & Body", 1500, 2500, "bottle", "navy"]]],
  ["home", "Household", ["Cleaning", "Kitchen"], "pump", "blue", [
    ["Dish Wash Liquid", "HomeCare", "Cleaning", 180, 220, "pump", "lime"],
    ["Laundry Detergent 1kg", "HomeCare", "Cleaning", 290, 350, "box", "blue"],
    ["Floor Cleaner 1L", "HomeCare", "Cleaning", 240, 290, "bottle", "teal"],
    ["Toilet Cleaner", "HomeCare", "Cleaning", 160, 200, "bottle", "navy"],
    ["Glass Cleaner", "HomeCare", "Cleaning", 190, 230, "pump", "blue"],
    ["Bleach 1L", "HomeCare", "Cleaning", 120, 150, "bottle", "white"],
    ["Paper Towels (2)", "HomeCare", "Kitchen", 140, 170, "roll", "white"],
    ["Garbage Bags (30)", "HomeCare", "Kitchen", 120, 150, "roll", "gray"],
    ["Kitchen Sponge (3)", "HomeCare", "Kitchen", 60, 80, "box", "yellow"],
    ["Air Freshener", "HomeCare", "Kitchen", 210, 260, "can", "pink"]]],
  ["spices", "Spices & Masala", ["Ground", "Whole"], "jar", "red", [
    ["Turmeric Powder 200g", "Spice Route", "Ground", 140, 170, "jar", "yellow"],
    ["Chili Powder 200g", "Spice Route", "Ground", 160, 190, "jar", "red"],
    ["Cumin Powder 100g", "Spice Route", "Ground", 130, 160, "jar", "brown"],
    ["Coriander Powder", "Spice Route", "Ground", 90, 110, "jar", "lime"],
    ["Garam Masala 100g", "Spice Route", "Ground", 150, 180, "jar", "choco"],
    ["Biryani Masala", "Spice Route", "Ground", 85, 100, "bag", "orange"],
    ["Black Pepper 100g", "Spice Route", "Whole", 220, 270, "jar", "gray"],
    ["Cinnamon Sticks", "Spice Route", "Whole", 110, 140, "jar", "brown"],
    ["Green Cardamom 50g", "Spice Route", "Whole", 340, 400, "jar", "green"],
    ["Bay Leaves", "Spice Route", "Whole", 40, 55, "bag", "dgreen"]]],
  ["noodles", "Noodles & Pasta", ["Noodles", "Pasta"], "bowl", "orange", [
    ["Instant Noodles (5)", "Wok & Co", "Noodles", 90, 110, "bag", "orange"],
    ["Cup Noodles", "Wok & Co", "Noodles", 80, 100, "cup", "red"],
    ["Egg Noodles 400g", "Wok & Co", "Noodles", 120, 145, "bag", "gold"],
    ["Rice Noodles 400g", "Wok & Co", "Noodles", 135, 160, "bag", "white"],
    ["Ramen Pack (3)", "Wok & Co", "Noodles", 260, 310, "box", "coral"],
    ["Spaghetti 500g", "Wok & Co", "Pasta", 170, 200, "box", "yellow"],
    ["Penne Pasta 500g", "Wok & Co", "Pasta", 170, 200, "bag", "gold"],
    ["Macaroni 400g", "Wok & Co", "Pasta", 120, 145, "bag", "tan"],
    ["Vermicelli 400g", "Wok & Co", "Pasta", 70, 85, "bag", "cream"],
    ["Pasta Sauce 350g", "Wok & Co", "Pasta", 280, 340, "jar", "red"]]],
  ["sweets", "Sweets & Chocolate", ["Chocolate", "Candy & Biscuits"], "bar", "choco", [
    ["Dark Chocolate Bar", "Choco Bliss", "Chocolate", 280, 340, "bar", "choco"],
    ["Milk Chocolate Bar", "Choco Bliss", "Chocolate", 220, 270, "bar", "brown"],
    ["Hazelnut Spread", "Choco Bliss", "Chocolate", 420, 520, "jar", "choco"],
    ["Chocolate Truffles", "Choco Bliss", "Chocolate", 480, 600, "box", "purple"],
    ["Cocoa Powder 200g", "Choco Bliss", "Chocolate", 260, 320, "can", "brown"],
    ["Gummy Bears", "Choco Bliss", "Candy & Biscuits", 120, 150, "bag", "pink"],
    ["Fruit Candy Mix", "Choco Bliss", "Candy & Biscuits", 90, 110, "bag", "coral"],
    ["Cream Biscuits", "Choco Bliss", "Candy & Biscuits", 60, 75, "box", "blue"],
    ["Chocolate Wafer", "Choco Bliss", "Candy & Biscuits", 70, 90, "box", "gold"],
    ["Rasgulla Tin 1kg", "Choco Bliss", "Candy & Biscuits", 380, 450, "can", "white"]]],
  ["breakfast", "Breakfast & Cereal", ["Cereal", "Spreads & Mixes"], "box", "gold", [
    ["Corn Flakes 500g", "Morning Bowl", "Cereal", 340, 400, "box", "yellow"],
    ["Choco Pillows", "Morning Bowl", "Cereal", 380, 450, "box", "choco"],
    ["Muesli 500g", "Morning Bowl", "Cereal", 450, 540, "bag", "tan"],
    ["Honey Granola", "Morning Bowl", "Cereal", 520, 620, "bag", "gold"],
    ["Cereal Bars (6)", "Morning Bowl", "Cereal", 240, 290, "box", "orange"],
    ["Instant Porridge", "Morning Bowl", "Cereal", 180, 220, "box", "cream"],
    ["Pancake Mix 500g", "Morning Bowl", "Spreads & Mixes", 290, 350, "box", "coral"],
    ["Maple Syrup", "Morning Bowl", "Spreads & Mixes", 650, 780, "bottle", "brown"],
    ["Mixed Fruit Jam", "Morning Bowl", "Spreads & Mixes", 230, 280, "jar", "purple"],
    ["Chia Seeds 250g", "Morning Bowl", "Spreads & Mixes", 340, 420, "bag", "gray"]]],
  ["baby", "Baby Care", ["Feeding", "Bath & Care"], "bottle", "pink", [
    ["Infant Formula 400g", "Little Sprout", "Feeding", 1100, 1250, "can", "blue"],
    ["Baby Cereal 250g", "Little Sprout", "Feeding", 480, 560, "box", "yellow"],
    ["Feeding Bottle", "Little Sprout", "Feeding", 350, 450, "bottle", "pink"],
    ["Fruit Puree Pouch", "Little Sprout", "Feeding", 140, 170, "bag", "orange"],
    ["Baby Diapers (M, 40)", "Little Sprout", "Bath & Care", 1150, 1400, "bag", "teal"],
    ["Baby Wipes (80)", "Little Sprout", "Bath & Care", 260, 320, "box", "blue"],
    ["Baby Lotion", "Little Sprout", "Bath & Care", 380, 460, "pump", "pink"],
    ["Baby Shampoo", "Little Sprout", "Bath & Care", 320, 390, "bottle", "yellow"],
    ["Baby Powder", "Little Sprout", "Bath & Care", 240, 290, "can", "white"],
    ["Rash Cream", "Little Sprout", "Bath & Care", 280, 340, "tube", "green"]]],
  ["pet", "Pet Care", ["Dogs", "Cats & Others"], "bag", "brown", [
    ["Dog Food 3kg", "Pet Pal", "Dogs", 1350, 1600, "bag", "brown"],
    ["Puppy Food 1.5kg", "Pet Pal", "Dogs", 850, 1000, "bag", "orange"],
    ["Dog Chew Treats", "Pet Pal", "Dogs", 320, 400, "bag", "tan"],
    ["Pet Shampoo", "Pet Pal", "Dogs", 420, 520, "bottle", "teal"],
    ["Dog Biscuits", "Pet Pal", "Dogs", 280, 340, "box", "gold"],
    ["Cat Food 1.5kg", "Pet Pal", "Cats & Others", 950, 1100, "bag", "coral"],
    ["Kitten Wet Food", "Pet Pal", "Cats & Others", 120, 150, "can", "pink"],
    ["Cat Litter 5kg", "Pet Pal", "Cats & Others", 780, 900, "sack", "gray"],
    ["Fish Food 100g", "Pet Pal", "Cats & Others", 140, 180, "can", "blue"],
    ["Bird Seed Mix", "Pet Pal", "Cats & Others", 180, 220, "bag", "yellow"]]],
  ["health", "Health & Wellness", ["Vitamins", "Wellness"], "jar", "teal", [
    ["Vitamin C 500mg", "VitaWell", "Vitamins", 420, 520, "jar", "orange"],
    ["Multivitamin (60)", "VitaWell", "Vitamins", 780, 950, "jar", "teal"],
    ["Omega-3 Fish Oil", "VitaWell", "Vitamins", 950, 1200, "jar", "gold"],
    ["Vitamin D3", "VitaWell", "Vitamins", 520, 640, "jar", "yellow"],
    ["Calcium + Zinc", "VitaWell", "Vitamins", 460, 560, "jar", "white"],
    ["Whey Protein 1kg", "VitaWell", "Wellness", 3200, 3800, "tub", "choco"],
    ["Herbal Tea Mix", "VitaWell", "Wellness", 260, 320, "box", "green"],
    ["ORS Saline (10)", "VitaWell", "Wellness", 80, 100, "box", "blue"],
    ["Hand Sanitizer", "VitaWell", "Wellness", 140, 180, "pump", "teal"],
    ["Digital Thermometer", "VitaWell", "Wellness", 350, 450, "tube", "navy"]]],
  ["hygiene", "Personal Hygiene", ["Oral Care", "Body Care"], "tube", "teal", [
    ["Toothpaste 150g", "PureCare", "Oral Care", 150, 180, "tube", "teal"],
    ["Charcoal Toothpaste", "PureCare", "Oral Care", 190, 230, "tube", "gray"],
    ["Toothbrush (2)", "PureCare", "Oral Care", 120, 150, "box", "blue"],
    ["Mouthwash 500ml", "PureCare", "Oral Care", 280, 340, "bottle", "teal"],
    ["Cotton Buds (200)", "PureCare", "Oral Care", 60, 80, "jar", "white"],
    ["Beauty Soap (4)", "PureCare", "Body Care", 210, 250, "box", "pink"],
    ["Hand Wash Refill", "PureCare", "Body Care", 150, 190, "pump", "lime"],
    ["Deodorant Spray", "PureCare", "Body Care", 320, 400, "can", "navy"],
    ["Tissue Box (3)", "PureCare", "Body Care", 180, 220, "box", "coral"],
    ["Razor Pack (3)", "PureCare", "Body Care", 140, 180, "box", "purple"]]],
];

export const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let n = 0;
export const CATEGORIES = CATALOG.map(([id, name, subs, kind, col]) => ({ id, name, subs, kind, color: C[col], image: categoryImage(id), fallback: categoryFallback(id) }));
const SUBSCRIBABLE = new Set(["dairy", "bakery", "grains", "pantry", "spices", "drinks", "noodles", "breakfast", "baby", "pet", "home", "hygiene"]);
export const PRODUCTS = CATALOG.flatMap(([category, , , , , rows]) =>
  rows.map(([name, brand, sub, price, mrp, kind, col, unit = "pc", status = null]) => {
    n += 1;
    return { id: n, name, brand, category, sub, price, mrp, unit, status, kind, color: C[col], image: productImage(name, n), fallback: productFallback(category, n), discount: Math.round(((mrp - price) / mrp) * 100), stock: status === "out" ? 0 : status === "low" ? 3 : null, subscribable: SUBSCRIBABLE.has(category) };
  })
);
export const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))];

export const productsByNames = (names) => names.map((nm) => PRODUCTS.find((p) => p.name === nm)).filter(Boolean);
export const productsByIds = (ids) => ids.map((id) => PRODUCTS.find((p) => p.id === id));

export const HERO = {
  title: "Grocery Shopping Made Fast, Easy & Affordable",
  text: "Fresh groceries delivered to your door step, anywhere in Bangladesh.",
  tiles: ["Tomato", "Mango", "Fresh Milk 1L", "Croissant (4)", "Rohu Fish", "Forest Honey 500g"],
};

// Occasional offers shown in the campaign slider (banner photo URLs come from src/lib/images.js)
export const CAMPAIGNS = [
  { id: "c1", image: bannerImage("c1"), fallback: bannerFallback("c1"), pct: 35, occasion: "Eid special", title: "Feast Essentials", offer: "Up to 35% off", cats: ["meat", "spices", "grains", "dairy"], hours: 20, from: "#7f1d1d", to: "#c2410c" },
  { id: "c2", image: bannerImage("c2"), fallback: bannerFallback("c2"), pct: 70, occasion: "Glow week", title: "Beauty & Personal Care", offer: "Up to 70% off", cats: ["beauty", "hygiene"], hours: 15, from: "#831843", to: "#db2777" },
  { id: "c3", image: bannerImage("c3"), fallback: bannerFallback("c3"), pct: 30, occasion: "Fresh harvest", title: "Fruits & Vegetables", offer: "Up to 30% off", cats: ["veg", "fruits"], hours: 8, from: "#14532d", to: "#16a34a" },
  { id: "c4", image: bannerImage("c4"), fallback: bannerFallback("c4"), pct: 40, occasion: "Winter treats", title: "Snacks & Sweets", offer: "Up to 40% off", cats: ["snacks", "sweets", "breakfast"], hours: 24, from: "#1e3a8a", to: "#7c3aed" },
];

// Offers section, part 1: live this weekend. Banner pictures live in public/banners/ (swap a file to change a banner).
export const WEEKEND_OFFERS = [
  { id: "w1", image: "/banners/weekend-sale.jpg", bg: "#d6c5a2", title: "Weekend Grocery Sale", cats: ["veg", "fruits", "grains", "dairy", "snacks", "drinks"] },
  { id: "w2", image: "/banners/combo-deals.jpg", bg: "#bfad9a", title: "Grocery Combo Deals", cats: ["pantry", "spices", "grains", "veg", "fruits"] },
];
// `off` = the "UP TO x% OFF" number shown big on the banner. Live offers can leave it out: the app then uses the best real product discount in the offer's categories.
// part 2: upcoming festive offers. `startsInHours` is a demo countdown (counted from page load) - set the real hours before launch.
export const UPCOMING_OFFERS = [
  { id: "u1", image: "/banners/eid-grocery.jpg", bg: "#e0d5c4", title: "Eid Grocery Sale", off: 30, startsInHours: 52 },
  { id: "u2", image: "/banners/eid-puja.jpg", bg: "#702b1f", title: "Eid & Puja Offer", off: 40, startsInHours: 100 },
  { id: "u3", image: "/banners/super-combo.jpg", bg: "#2d0f0f", title: "Eid-ul-Adha & Durga Puja Super Combo", off: 35, startsInHours: 148 },
];

export const RECIPES = [
  { name: "Veggie Curry", image: "/recipes/veggie-curry.jpg", items: ["Tomato", "Carrot", "Potato", "Red Onion", "Turmeric Powder 200g"] },
  { name: "Fruit Breakfast Bowl", image: "/recipes/fruit-breakfast-bowl.jpg", items: ["Banana (dozen)", "Apple", "Mango", "Plain Yogurt 500g"] },
  { name: "Cheesy Omelette", image: "/recipes/cheesy-omelette.jpg", items: ["Farm Eggs (12)", "Cheese Slices", "Salted Butter 200g", "Green Chili"] },
  { name: "Chicken Curry & Rice", items: ["Broiler Chicken", "Potato", "Red Onion", "Basmati Rice 5kg", "Garam Masala 100g"] },
  { name: "Crispy Fish Fry", items: ["Rohu Fish", "Turmeric Powder 200g", "Mustard Oil 1L", "Sea Salt 500g"] },
  { name: "Honey Butter Toast", items: ["Sandwich Bread", "Salted Butter 200g", "Forest Honey 500g"] },
];
export const LAST_ORDER = ["Fresh Milk 1L", "Farm Eggs (12)", "Tomato", "Banana (dozen)"];
