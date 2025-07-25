import { tool } from "ai";
import type { Strategy } from "../../types";
import { z } from "zod";

export const productCatalogTools = {
    searchProducts: tool({
        description: 'Search for shoes in the catalog by category, brand, or features',
        inputSchema: z.object({
            query: z.string().describe('Search query for products'),
            category: z.enum(['running', 'casual', 'formal', 'athletic', 'boots', 'sandals']).optional(),
            brand: z.string().optional(),
            maxPrice: z.number().optional(),
            minPrice: z.number().optional(),
            gender: z.enum(['men', 'women', 'unisex']).optional(),
            limit: z.number().default(5).describe('Maximum number of products to return')
        }),
        execute: async ({ query, category, brand, maxPrice, minPrice, gender, limit }) => {
            console.log(`TOOL EXECUTED: searchProducts with query: ${query}`);

            const mockProducts = [
                {
                    id: 'nike-air-max-001',
                    name: 'Nike Air Max 270',
                    brand: 'Nike',
                    category: 'running',
                    price: 129.99,
                    gender: 'unisex',
                    colors: ['black', 'white', 'blue', 'red'],
                    sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12],
                    features: ['Air cushioning', 'Breathable mesh', 'Lightweight'],
                    description: 'Revolutionary Air Max cushioning provides all-day comfort',
                    rating: 4.5,
                    reviewCount: 1247,
                    inStock: true,
                    images: ['nike-air-max-270-1.jpg', 'nike-air-max-270-2.jpg']
                },
                {
                    id: 'adidas-ultraboost-002',
                    name: 'Adidas Ultraboost 22',
                    brand: 'Adidas',
                    category: 'running',
                    price: 189.99,
                    gender: 'unisex',
                    colors: ['black', 'white', 'grey'],
                    sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12],
                    features: ['Boost cushioning', 'Primeknit upper', 'Continental rubber outsole'],
                    description: 'Premium running shoe with responsive Boost cushioning',
                    rating: 4.7,
                    reviewCount: 892,
                    inStock: true,
                    images: ['adidas-ultraboost-22-1.jpg', 'adidas-ultraboost-22-2.jpg']
                },
                {
                    id: 'new-balance-1080-003',
                    name: 'New Balance Fresh Foam 1080v12',
                    brand: 'New Balance',
                    category: 'running',
                    price: 149.99,
                    gender: 'unisex',
                    colors: ['black', 'white', 'navy'],
                    sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12],
                    features: ['Fresh Foam cushioning', 'Engineered mesh', 'Ortholite insole'],
                    description: 'Plush Fresh Foam midsole for maximum comfort on long runs',
                    rating: 4.6,
                    reviewCount: 743,
                    inStock: true,
                    images: ['nb-1080-1.jpg', 'nb-1080-2.jpg']
                }
            ];

            let filteredProducts = mockProducts.filter(product => {
                if (category && product.category !== category) return false;
                if (brand && product.brand.toLowerCase() !== brand.toLowerCase()) return false;
                if (maxPrice && product.price > maxPrice) return false;
                if (minPrice && product.price < minPrice) return false;
                if (gender && product.gender !== 'unisex' && product.gender !== gender) return false;
                if (query && !product.name.toLowerCase().includes(query.toLowerCase()) &&
                    !product.features.some(f => f.toLowerCase().includes(query.toLowerCase()))) return false;
                return true;
            });

            return {
                products: filteredProducts.slice(0, limit || 5),
                totalCount: filteredProducts.length,
                query: { query, category, brand, maxPrice, minPrice, gender }
            };
        }
    }),

    getProductDetails: tool({
        description: 'Get detailed information about a specific product',
        inputSchema: z.object({
            productId: z.string().describe('The unique ID of the product'),
        }),
        execute: async ({ productId }) => {
            console.log(`TOOL EXECUTED: getProductDetails for product: ${productId}`);

            const productDetails = {
                id: productId,
                name: 'Nike Air Max 270',
                brand: 'Nike',
                category: 'running',
                price: 129.99,
                originalPrice: 149.99,
                discount: 13,
                gender: 'unisex',
                colors: ['black', 'white', 'blue', 'red'],
                sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12],
                features: ['Air cushioning', 'Breathable mesh', 'Lightweight', 'Durable rubber outsole'],
                detailedDescription: 'The Nike Air Max 270 features the largest heel Air unit in Nike Air Max history, delivering incredible cushioning and a bouncy feel with every step.',
                specifications: {
                    weight: '10.2 oz',
                    drop: '10mm',
                    materials: ['Synthetic leather', 'Mesh', 'Rubber'],
                    purpose: ['Casual wear', 'Light running', 'Walking']
                },
                rating: 4.5,
                reviewCount: 1247,
                reviews: [
                    { rating: 5, comment: 'Super comfortable for daily wear!', author: 'Sarah M.' },
                    { rating: 4, comment: 'Great value for money, stylish design.', author: 'Mike T.' }
                ],
                inStock: true,
                stockCount: 45,
                shippingInfo: {
                    freeShipping: true,
                    estimatedDelivery: '3-5 business days',
                    returnPolicy: '30-day return policy'
                },
                relatedProducts: ['adidas-ultraboost-002', 'new-balance-1080-003']
            };

            return productDetails;
        }
    }),

    checkInventory: tool({
        description: 'Check availability of specific size and color for a product',
        inputSchema: z.object({
            productId: z.string().describe('The unique ID of the product'),
            size: z.number().describe('Shoe size to check'),
            color: z.string().describe('Color to check availability for')
        }),
        execute: async ({ productId, size, color }) => {
            console.log(`TOOL EXECUTED: checkInventory for ${productId}, size ${size}, color ${color}`);

            return {
                productId,
                size,
                color,
                available: true,
                quantity: 12,
                estimatedRestock: null
            };
        }
    }),

    getRecommendations: tool({
        description: 'Get product recommendations based on customer preferences or current product',
        inputSchema: z.object({
            basedOnProduct: z.string().optional().describe('Product ID to base recommendations on'),
            customerPreferences: z.object({
                category: z.string().optional(),
                priceRange: z.object({
                    min: z.number().optional(),
                    max: z.number().optional()
                }).optional(),
                brand: z.string().optional(),
                features: z.array(z.string()).optional()
            }).optional(),
            type: z.enum(['similar', 'complementary', 'popular']).default('similar')
        }),
        execute: async ({ basedOnProduct, customerPreferences, type }) => {
            console.log(`TOOL EXECUTED: getRecommendations type: ${type}`);

            const recommendations = [
                {
                    id: 'nike-air-force-001',
                    name: 'Nike Air Force 1',
                    price: 89.99,
                    reason: 'Similar style and comfort level',
                    matchScore: 0.85
                },
                {
                    id: 'adidas-stan-smith-002',
                    name: 'Adidas Stan Smith',
                    price: 79.99,
                    reason: 'Popular casual alternative',
                    matchScore: 0.78
                },
                {
                    id: 'converse-chuck-003',
                    name: 'Converse Chuck Taylor',
                    price: 59.99,
                    reason: 'Classic style with great value',
                    matchScore: 0.72
                }
            ];

            return {
                recommendations,
                basedOn: basedOnProduct || 'customer preferences',
                type
            };
        }
    }),

    getPromotions: tool({
        description: 'Get current promotions and deals',
        inputSchema: z.object({
            productId: z.string().optional().describe('Check promotions for specific product'),
            category: z.string().optional().describe('Check promotions for category')
        }),
        execute: async ({ productId, category }) => {
            console.log(`TOOL EXECUTED: getPromotions for product: ${productId}, category: ${category}`);

            return {
                activePromotions: [
                    {
                        id: 'promo-001',
                        title: 'Buy 2 Get 1 50% Off',
                        description: 'Mix and match any shoes',
                        validUntil: '2024-12-31',
                        applicable: true
                    },
                    {
                        id: 'promo-002',
                        title: 'Free Shipping Over $100',
                        description: 'No minimum for premium members',
                        validUntil: '2024-12-31',
                        applicable: true
                    },
                    {
                        id: 'promo-003',
                        title: 'Student Discount',
                        description: '15% off with valid student ID',
                        validUntil: '2024-12-31',
                        applicable: true
                    }
                ],
                memberDiscounts: {
                    available: true,
                    percentage: 10,
                    description: 'Sign up for 10% off your first order'
                }
            };
        }
    })
};

export const shoeSalesStrategy: Strategy = {
    name: 'Shoe Sales Bot',
    domain: 'e-commerce',
    llm_provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    primary_goal: 'Guide customers through a personalized shoe shopping experience that results in satisfied purchases',
    secondary_goals: [
        'Understand customer lifestyle and preferences',
        'Match products to specific use cases and needs',
        'Build trust through product expertise',
        'Maximize order value through strategic recommendations',
        'Ensure customer satisfaction and reduce returns'
    ],
    personality: {
        tone: 'friendly and knowledgeable',
        style: 'consultative and helpful',
        pace: 'adaptive to customer engagement',
    },
    guidelines: {
        must_do: [
            'Always greet warmly and ask how you can help',
            'Discover customer\'s primary use case for shoes within first 3 exchanges',
            'Ask about size, preferred brands, and budget range early in conversation',
            'Use searchProducts tool before making any recommendations',
            'Present 2-3 options with clear differentiation and reasons for each',
            'Use checkInventory tool for recommended products',
            'Use getPromotions tool to mention current deals',
            'Use getProductDetails tool for specific product inquiries',
            'Provide specific product benefits related to customer needs',
            'Confirm size and color availability before suggesting purchase'
        ],
        must_not_do: [
            'Recommend products without using searchProducts tool',
            'Make claims about products without using getProductDetails tool',
            'Push expensive items when customer has stated budget constraints',
            'Ignore customer feedback or objections',
            'Recommend products without checking inventory',
            'Use technical jargon without explanation',
            'Rush the customer to make a decision'
        ],
        prefer_to_do: [
            'Ask follow-up questions to better understand specific needs',
            'Share relevant product features from tool results',
            'Use social proof (ratings, reviews) from product data',
            'Offer styling advice and outfit coordination',
            'Suggest care tips to extend shoe life',
            'Highlight return policy and guarantees to reduce purchase anxiety',
            'Create urgency with limited-time offers from getPromotions',
            'Use getRecommendations tool for additional suggestions'
        ],
        avoid_doing: [
            'Overwhelming with too many product options at once',
            'Focusing only on price as a selling point',
            'Making assumptions about customer preferences',
            'Pushing products that don\'t align with stated needs',
            'Ignoring customer budget or timeline constraints'
        ],
    },
    knowledge: {
        key_info: [
            'Use tools to get accurate product information',
            'Carry major brands: Nike, Adidas, New Balance, Puma, Converse, Vans',
            'Price range: $39.99 - $299.99',
            'Free shipping on orders over $100',
            '30-day hassle-free return policy',
            'Size exchange guarantee within 60 days',
            'Customer loyalty program with 10% discount',
            'Expert fitting advice available'
        ],
        common_questions: [
            'What\'s the difference between running and training shoes?',
            'How do I know if these shoes will fit?',
            'Do you have wide width options?',
            'What\'s your return policy?',
            'How long does shipping take?',
            'Do you have any current promotions?',
            'Are these shoes good for [specific activity]?',
            'What colors are available in my size?'
        ],
        escalation_triggers: [
            'Custom orthotic fitting requirements',
            'Bulk orders over $1000',
            'Professional athlete endorsements or sponsorships',
            'Complex warranty or defect claims',
            'International shipping complications',
            'Business account setup requests'
        ]
    }
};