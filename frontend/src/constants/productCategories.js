export const dairy = {
    label: 'Dairy',
    categoriesApi: ['dairy'],
    products: [
        {
            productName: 'Milk',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746432/milk_vql23d.png'
        },  
        {
            productName: 'Desi Ghee',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/desi-ghee_gqqy3p.png'
        },
        {
            productName: 'Butter & Curd',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746419/butter_xdsqav.png'
        },
        {
            productName: 'Paneer & Cheese',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746418/cheese_jswma1.png'
        }
    ]
}

export const snacksAndBeverages = {
    label: 'Snacks & Beverages',
    categoriesApi: ['snacks', 'beverages'],
    products: [{
        productName: 'Biscuits',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746415/biscuits_zm5ohb.png'
    },
    {
        productName: 'Dry fruits',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746424/dry-fruits_odjifc.png'
    },
    {
        productName: 'Chips & Namkeens',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746419/chips_w9fj3a.png'
    },
    {
        productName: 'Chocolates & Sweets',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746419/chocolates_qzvyv1.png'
    },
    {
        productName: 'Soft Drinks',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746436/soft-drinks_bikzdj.png'
    },
    {
        productName: 'Juices',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746430/juices_wooyuu.png'
    },
    {
        productName: 'Coffee Powders',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746420/coffee_qswaug.png'
    },
    {
        productName: 'Water & Sodas',
        imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746440/water_uxclry.png'
    },
    ]
}

export const fruitsAndVegetables = {
    label: 'Fruits & Vegetables',
    categoriesApi: ['vegetables', 'fruits'],
    products: [
        {
            productName: 'Fresh Vegetables',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746431/leafy-vegetables_bz9aw2.png'
        },
        {
            productName: 'Fresh Fruits',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746429/fruits-img_bsqr6i.png'
        },
    ]
}

export const healthAndWellness = {
    label: 'Health & Wellness',
    categoriesApi: ['health_and_wellness'],

    products: [
        {
            productName: 'Vitamins & Supplements',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746430/health_wellness_vnmz0f.png'
        },

        {
            productName: 'Hand Sanitizers',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761751130/40166033_4-savlon-hand-sanitizer-gel-removebg-preview_gkzr8r.png'
        },
        {
            productName: 'Ayurvedic Care',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761750348/SkinCareAyurvedicPack-removebg-preview_vnlvzg.png'
        },
        {
            productName: 'Thermometers & Oximeters',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761830038/6189MAMYiqL._AC_UF1000_1000_QL80_-removebg-preview_fkmpdc.png'
        }
    ]
}

export const personalCare = {
    label: 'Personal Care',
    categoriesApi: ['personal_care'],
    products: [
        {
            productName: 'Moisturizers & Creams',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746432/moisturizers_w3fxra.png'
        },
        {
            productName: 'Sunscreens',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746437/sunscreens_kp1t3m.png'
        },
        {
            productName: 'Deodorants & Perfumes',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761752241/Y19wYWQsd181MDAsaF81MDAsYXJfMTox_tyfvoo.png'
        },
        {
            productName: 'Bath Items',
            imageUrl: 'https://res.cloudinary.com/dusia02q8/image/upload/v1761746417/body-wash_inrtyn.png'
        },
    ]

}
export const allCategories = [
    dairy,
    personalCare,
    snacksAndBeverages,
    healthAndWellness,
    fruitsAndVegetables,
]