import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ComposedChart, Area
} from 'recharts';
import SEO from '../../components/common/SEO';
import germanyHeatmap from '../../assets/images/germany_cost_heatmap.webp';

// ==================== EMBEDDED DATA ====================

const CURRENCY_RATES = {
    EUR: 1,
    USD: 1.09,
    INR: 90.5,
    CNY: 7.85,
    NGN: 1650,
    PKR: 302,
    BDT: 119,
    GBP: 0.86
};

const GERMAN_STATES = [
    {
        id: 'bw',
        name: 'Baden-Württemberg',
        capital: 'Stuttgart',
        cities: ['Stuttgart', 'Heidelberg', 'Freiburg', 'Karlsruhe', 'Mannheim', 'Tübingen'],
        avgRent: 520,
        costIndex: 115,
        universities: 70,
        color: '#1a365d'
    },
    {
        id: 'by',
        name: 'Bavaria',
        capital: 'Munich',
        cities: ['Munich', 'Nuremberg', 'Augsburg', 'Würzburg', 'Regensburg', 'Erlangen'],
        avgRent: 580,
        costIndex: 125,
        universities: 58,
        color: '#0d9488'
    },
    {
        id: 'be',
        name: 'Berlin',
        capital: 'Berlin',
        cities: ['Berlin'],
        avgRent: 480,
        costIndex: 108,
        universities: 39,
        color: '#dc2626'
    },
    {
        id: 'bb',
        name: 'Brandenburg',
        capital: 'Potsdam',
        cities: ['Potsdam', 'Cottbus', 'Frankfurt (Oder)'],
        avgRent: 340,
        costIndex: 88,
        universities: 10,
        color: '#7c3aed'
    },
    {
        id: 'hb',
        name: 'Bremen',
        capital: 'Bremen',
        cities: ['Bremen', 'Bremerhaven'],
        avgRent: 380,
        costIndex: 95,
        universities: 8,
        color: '#059669'
    },
    {
        id: 'hh',
        name: 'Hamburg',
        capital: 'Hamburg',
        cities: ['Hamburg'],
        avgRent: 520,
        costIndex: 118,
        universities: 20,
        color: '#b91c1c'
    },
    {
        id: 'he',
        name: 'Hesse',
        capital: 'Wiesbaden',
        cities: ['Frankfurt', 'Darmstadt', 'Marburg', 'Gießen', 'Kassel'],
        avgRent: 480,
        costIndex: 112,
        universities: 31,
        color: '#c2410c'
    },
    {
        id: 'ni',
        name: 'Lower Saxony',
        capital: 'Hanover',
        cities: ['Hanover', 'Göttingen', 'Braunschweig', 'Oldenburg', 'Osnabrück'],
        avgRent: 400,
        costIndex: 96,
        universities: 29,
        color: '#4f46e5'
    },
    {
        id: 'mv',
        name: 'Mecklenburg-Vorpommern',
        capital: 'Schwerin',
        cities: ['Rostock', 'Greifswald', 'Schwerin'],
        avgRent: 320,
        costIndex: 82,
        universities: 7,
        color: '#0891b2'
    },
    {
        id: 'nw',
        name: 'North Rhine-Westphalia',
        capital: 'Düsseldorf',
        cities: ['Cologne', 'Düsseldorf', 'Bonn', 'Aachen', 'Münster', 'Dortmund'],
        avgRent: 450,
        costIndex: 105,
        universities: 68,
        color: '#65a30d'
    },
    {
        id: 'rp',
        name: 'Rhineland-Palatinate',
        capital: 'Mainz',
        cities: ['Mainz', 'Trier', 'Kaiserslautern', 'Koblenz'],
        avgRent: 380,
        costIndex: 94,
        universities: 18,
        color: '#ca8a04'
    },
    {
        id: 'sl',
        name: 'Saarland',
        capital: 'Saarbrücken',
        cities: ['Saarbrücken'],
        avgRent: 350,
        costIndex: 90,
        universities: 5,
        color: '#db2777'
    },
    {
        id: 'sn',
        name: 'Saxony',
        capital: 'Dresden',
        cities: ['Leipzig', 'Dresden', 'Chemnitz'],
        avgRent: 340,
        costIndex: 85,
        universities: 24,
        color: '#16a34a'
    },
    {
        id: 'st',
        name: 'Saxony-Anhalt',
        capital: 'Magdeburg',
        cities: ['Halle', 'Magdeburg'],
        avgRent: 300,
        costIndex: 80,
        universities: 10,
        color: '#2563eb'
    },
    {
        id: 'sh',
        name: 'Schleswig-Holstein',
        capital: 'Kiel',
        cities: ['Kiel', 'Lübeck', 'Flensburg'],
        avgRent: 400,
        costIndex: 98,
        universities: 11,
        color: '#7c2d12'
    },
    {
        id: 'th',
        name: 'Thuringia',
        capital: 'Erfurt',
        cities: ['Jena', 'Erfurt', 'Weimar', 'Ilmenau'],
        avgRent: 310,
        costIndex: 82,
        universities: 12,
        color: '#6d28d9'
    }
];

const CITIES_DATA = [
    { name: 'Munich', state: 'Bavaria', rent: 650, groceries: 220, transport: 0, dining: 80, leisure: 70, total: 1150, costIndex: 130, popularity: 95, studentPop: 128000 },
    { name: 'Frankfurt', state: 'Hesse', rent: 550, groceries: 200, transport: 0, dining: 70, leisure: 65, total: 1020, costIndex: 118, popularity: 85, studentPop: 72000 },
    { name: 'Stuttgart', state: 'Baden-Württemberg', rent: 520, groceries: 195, transport: 0, dining: 65, leisure: 60, total: 970, costIndex: 115, popularity: 80, studentPop: 58000 },
    { name: 'Hamburg', state: 'Hamburg', rent: 530, groceries: 190, transport: 0, dining: 70, leisure: 65, total: 985, costIndex: 116, popularity: 90, studentPop: 105000 },
    { name: 'Düsseldorf', state: 'NRW', rent: 500, groceries: 185, transport: 0, dining: 65, leisure: 60, total: 940, costIndex: 112, popularity: 75, studentPop: 45000 },
    { name: 'Berlin', state: 'Berlin', rent: 480, groceries: 180, transport: 0, dining: 60, leisure: 55, total: 905, costIndex: 108, popularity: 98, studentPop: 195000 },
    { name: 'Cologne', state: 'NRW', rent: 470, groceries: 175, transport: 0, dining: 60, leisure: 55, total: 890, costIndex: 106, popularity: 88, studentPop: 100000 },
    { name: 'Heidelberg', state: 'Baden-Württemberg', rent: 480, groceries: 180, transport: 0, dining: 55, leisure: 50, total: 895, costIndex: 107, popularity: 82, studentPop: 38000 },
    { name: 'Freiburg', state: 'Baden-Württemberg', rent: 460, groceries: 175, transport: 0, dining: 55, leisure: 50, total: 870, costIndex: 104, popularity: 78, studentPop: 33000 },
    { name: 'Bonn', state: 'NRW', rent: 440, groceries: 170, transport: 0, dining: 55, leisure: 50, total: 845, costIndex: 102, popularity: 72, studentPop: 38000 },
    { name: 'Aachen', state: 'NRW', rent: 420, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 810, costIndex: 98, popularity: 76, studentPop: 60000 },
    { name: 'Münster', state: 'NRW', rent: 430, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 820, costIndex: 99, popularity: 80, studentPop: 62000 },
    { name: 'Hanover', state: 'Lower Saxony', rent: 410, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 800, costIndex: 97, popularity: 70, studentPop: 48000 },
    { name: 'Nuremberg', state: 'Bavaria', rent: 420, groceries: 170, transport: 0, dining: 55, leisure: 50, total: 825, costIndex: 100, popularity: 68, studentPop: 35000 },
    { name: 'Göttingen', state: 'Lower Saxony', rent: 380, groceries: 160, transport: 0, dining: 45, leisure: 40, total: 755, costIndex: 92, popularity: 74, studentPop: 31000 },
    { name: 'Marburg', state: 'Hesse', rent: 370, groceries: 155, transport: 0, dining: 45, leisure: 40, total: 740, costIndex: 90, popularity: 70, studentPop: 26000 },
    { name: 'Tübingen', state: 'Baden-Württemberg', rent: 420, groceries: 165, transport: 0, dining: 50, leisure: 45, total: 810, costIndex: 98, popularity: 72, studentPop: 28000 },
    { name: 'Leipzig', state: 'Saxony', rent: 350, groceries: 150, transport: 0, dining: 40, leisure: 35, total: 705, costIndex: 85, popularity: 92, studentPop: 40000 },
    { name: 'Dresden', state: 'Saxony', rent: 360, groceries: 155, transport: 0, dining: 45, leisure: 40, total: 730, costIndex: 88, popularity: 86, studentPop: 43000 },
    { name: 'Jena', state: 'Thuringia', rent: 330, groceries: 145, transport: 0, dining: 40, leisure: 35, total: 680, costIndex: 82, popularity: 75, studentPop: 23000 },
    { name: 'Halle', state: 'Saxony-Anhalt', rent: 300, groceries: 140, transport: 0, dining: 35, leisure: 30, total: 635, costIndex: 78, popularity: 65, studentPop: 21000 },
    { name: 'Magdeburg', state: 'Saxony-Anhalt', rent: 310, groceries: 145, transport: 0, dining: 38, leisure: 32, total: 655, costIndex: 80, popularity: 62, studentPop: 18000 },
    { name: 'Greifswald', state: 'Mecklenburg-Vorpommern', rent: 290, groceries: 140, transport: 0, dining: 35, leisure: 30, total: 625, costIndex: 76, popularity: 58, studentPop: 11000 },
    { name: 'Chemnitz', state: 'Saxony', rent: 280, groceries: 138, transport: 0, dining: 32, leisure: 28, total: 608, costIndex: 74, popularity: 52, studentPop: 10000 },
    { name: 'Rostock', state: 'Mecklenburg-Vorpommern', rent: 340, groceries: 150, transport: 0, dining: 42, leisure: 38, total: 700, costIndex: 85, popularity: 68, studentPop: 15000 }
];

const EXPENSE_CATEGORIES = {
    housing: {
        name: 'Housing',
        icon: '🏠',
        items: [
            { name: 'Student Dormitory (Single)', min: 200, avg: 280, max: 400 },
            { name: 'Student Dormitory (Shared)', min: 150, avg: 220, max: 300 },
            { name: 'WG Room (Shared Flat)', min: 280, avg: 400, max: 600 },
            { name: 'Studio Apartment', min: 400, avg: 550, max: 900 },
            { name: 'Utilities (Electricity/Heating)', min: 50, avg: 80, max: 150 },
            { name: 'Internet', min: 20, avg: 30, max: 45 },
            { name: 'GEZ (TV/Radio Fee)', min: 18.36, avg: 18.36, max: 18.36 }
        ]
    },
    transport: {
        name: 'Transportation',
        icon: '🚇',
        items: [
            { name: 'Semester Ticket (6 months)', min: 0, avg: 0, max: 0, note: 'Included in semester fees' },
            { name: 'Deutschland-Ticket', min: 49, avg: 49, max: 49 },
            { name: 'Monthly Transit Pass', min: 60, avg: 85, max: 120 },
            { name: 'Single Ride Ticket', min: 2.5, avg: 3.2, max: 4.5 },
            { name: 'Used Bicycle', min: 50, avg: 150, max: 300, note: 'One-time' },
            { name: 'New Bicycle', min: 200, avg: 400, max: 800, note: 'One-time' }
        ]
    },
    groceries: {
        name: 'Food & Groceries',
        icon: '🛒',
        items: [
            { name: 'Monthly Groceries (Budget)', min: 120, avg: 150, max: 180 },
            { name: 'Monthly Groceries (Moderate)', min: 180, avg: 220, max: 280 },
            { name: 'Mensa Meal (Student)', min: 2.5, avg: 3.5, max: 5 },
            { name: 'Bread (500g)', min: 0.8, avg: 1.5, max: 3 },
            { name: 'Milk (1L)', min: 0.8, avg: 1.1, max: 1.8 },
            { name: 'Eggs (12)', min: 1.8, avg: 2.5, max: 4 },
            { name: 'Rice (1kg)', min: 1.5, avg: 2.5, max: 4 },
            { name: 'Chicken Breast (1kg)', min: 6, avg: 9, max: 14 }
        ]
    },
    restaurants: {
        name: 'Dining Out',
        icon: '🍽️',
        items: [
            { name: 'Döner Kebab', min: 5, avg: 7, max: 10 },
            { name: 'Fast Food Meal', min: 7, avg: 9, max: 12 },
            { name: 'Casual Restaurant', min: 10, avg: 15, max: 22 },
            { name: 'Mid-Range Restaurant', min: 18, avg: 25, max: 40 },
            { name: 'Coffee (Café)', min: 2.5, avg: 3.5, max: 5 },
            { name: 'Beer (Bar)', min: 3.5, avg: 4.5, max: 6 },
            { name: 'Beer (Supermarket 0.5L)', min: 0.6, avg: 1, max: 2 }
        ]
    },
    healthcare: {
        name: 'Healthcare',
        icon: '🏥',
        items: [
            { name: 'Public Insurance (Under 30)', min: 110, avg: 115, max: 125 },
            { name: 'Public Insurance (Over 30)', min: 180, avg: 220, max: 280 },
            { name: 'Private Insurance', min: 80, avg: 150, max: 300 },
            { name: 'Prescription Co-pay', min: 5, avg: 7, max: 10 },
            { name: 'Dental Cleaning', min: 50, avg: 80, max: 120 }
        ]
    },
    education: {
        name: 'Education',
        icon: '📚',
        items: [
            { name: 'Semester Contribution', min: 150, avg: 300, max: 420, note: 'Per semester' },
            { name: 'Textbooks (Per Semester)', min: 50, avg: 100, max: 200 },
            { name: 'Printing/Copying', min: 5, avg: 15, max: 30 },
            { name: 'Laptop (One-time)', min: 400, avg: 800, max: 1500, note: 'One-time' },
            { name: 'German Course (Intensive)', min: 200, avg: 400, max: 800, note: 'Per course' }
        ]
    },
    leisure: {
        name: 'Leisure & Entertainment',
        icon: '🎬',
        items: [
            { name: 'Cinema Ticket (Student)', min: 6, avg: 8, max: 12 },
            { name: 'Gym (Uni Sports)', min: 10, avg: 25, max: 50, note: 'Per semester' },
            { name: 'Gym (Commercial)', min: 15, avg: 25, max: 50 },
            { name: 'Netflix/Streaming', min: 5, avg: 13, max: 18 },
            { name: 'Spotify Student', min: 5, avg: 5, max: 5 },
            { name: 'Club Entry', min: 5, avg: 12, max: 20 },
            { name: 'Museum (Student)', min: 0, avg: 4, max: 8 }
        ]
    },
    personal: {
        name: 'Personal Care',
        icon: '✨',
        items: [
            { name: 'Haircut (Budget)', min: 10, avg: 18, max: 30 },
            { name: 'Haircut (Salon)', min: 25, avg: 40, max: 70 },
            { name: 'Toiletries (Monthly)', min: 15, avg: 25, max: 40 },
            { name: 'Laundry (Per Load)', min: 2, avg: 3.5, max: 5 }
        ]
    },
    communication: {
        name: 'Communication',
        icon: '📱',
        items: [
            { name: 'Prepaid SIM (Monthly)', min: 7, avg: 12, max: 20 },
            { name: 'Phone Contract', min: 15, avg: 25, max: 45 },
            { name: 'Home Internet', min: 25, avg: 35, max: 50 }
        ]
    }
};

const BUDGET_TIERS = [
    { name: 'Survival', range: '€700-850', monthly: 775, description: 'Very tight, minimal extras', color: '#ef4444' },
    { name: 'Comfortable', range: '€850-1,100', monthly: 975, description: 'Balanced lifestyle', color: '#f59e0b' },
    { name: 'Relaxed', range: '€1,100-1,400', monthly: 1250, description: 'More flexibility', color: '#22c55e' }
];

const MONTHLY_BREAKDOWN = [
    { category: 'Rent', survival: 300, comfortable: 420, relaxed: 550 },
    { category: 'Health Insurance', survival: 110, comfortable: 115, relaxed: 120 },
    { category: 'Groceries', survival: 140, comfortable: 200, relaxed: 280 },
    { category: 'Transport', survival: 0, comfortable: 25, relaxed: 49 },
    { category: 'Phone/Internet', survival: 20, comfortable: 30, relaxed: 45 },
    { category: 'Study Materials', survival: 20, comfortable: 35, relaxed: 50 },
    { category: 'Personal Care', survival: 20, comfortable: 30, relaxed: 45 },
    { category: 'Leisure', survival: 25, comfortable: 60, relaxed: 100 },
    { category: 'Dining Out', survival: 20, comfortable: 45, relaxed: 80 },
    { category: 'Miscellaneous', survival: 20, comfortable: 40, relaxed: 80 }
];

const FIRST_MONTH_COSTS = [
    { item: 'Security Deposit (2-3 months)', min: 600, max: 1500 },
    { item: 'First Month Rent', min: 300, max: 650 },
    { item: 'Furniture/Basics (if unfurnished)', min: 200, max: 800 },
    { item: 'Bedding & Linens', min: 50, max: 150 },
    { item: 'Kitchen Essentials', min: 50, max: 200 },
    { item: 'Initial Groceries', min: 80, max: 150 },
    { item: 'Semester Contribution', min: 150, max: 420 },
    { item: 'Health Insurance (First Payment)', min: 110, max: 150 },
    { item: 'Phone SIM Card', min: 10, max: 30 },
    { item: 'Liability Insurance (Annual)', min: 35, max: 60 }
];

const MONEY_SAVING_TIPS = [
    { tip: 'Apply for student housing 6+ months early', impact: 'Save €100-200/month on rent' },
    { tip: 'Use Mensa (university cafeteria) for meals', impact: 'Meals from €2.50-4.50' },
    { tip: 'Get the Deutschland-Ticket for €49/month', impact: 'Unlimited nationwide travel' },
    { tip: 'Shop at Aldi, Lidl, Penny for groceries', impact: 'Save 30-40% on food costs' },
    { tip: 'Buy used furniture on eBay Kleinanzeigen', impact: 'Save 60-80% on furnishing' },
    { tip: 'Use university library instead of buying books', impact: 'Save €100-300/semester' },
    { tip: 'Join Hochschulsport for cheap fitness', impact: '€10-30/semester vs €30/month gym' },
    { tip: 'Cook in batches and meal prep', impact: 'Save €50-100/month on food' },
    { tip: 'Get ISIC card for international discounts', impact: 'Discounts on travel, shopping, more' },
    { tip: 'Consider East German cities', impact: '20-40% lower living costs' }
];

const SUPERMARKETS = [
    { name: 'Aldi', tier: 'Budget', priceLevel: 1 },
    { name: 'Lidl', tier: 'Budget', priceLevel: 1 },
    { name: 'Penny', tier: 'Budget', priceLevel: 1 },
    { name: 'Netto', tier: 'Budget', priceLevel: 1.1 },
    { name: 'REWE', tier: 'Mid-range', priceLevel: 1.4 },
    { name: 'Edeka', tier: 'Mid-range', priceLevel: 1.5 },
    { name: 'Kaufland', tier: 'Mid-range', priceLevel: 1.3 },
    { name: 'Alnatura', tier: 'Organic', priceLevel: 2 },
    { name: 'Bio Company', tier: 'Organic', priceLevel: 2.2 }
];

const RENT_TRENDS = [
    { year: '2019', munich: 520, berlin: 380, leipzig: 280, avg: 380 },
    { year: '2020', munich: 550, berlin: 400, leipzig: 290, avg: 400 },
    { year: '2021', munich: 580, berlin: 430, leipzig: 310, avg: 420 },
    { year: '2022', munich: 620, berlin: 460, leipzig: 330, avg: 450 },
    { year: '2023', munich: 640, berlin: 475, leipzig: 345, avg: 465 },
    { year: '2024', munich: 650, berlin: 480, leipzig: 350, avg: 475 }
];

// ==================== COMPONENTS ====================

const GermanyCostOfLiving = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCities, setSelectedCities] = useState(['Berlin', 'Munich']);
    const [selectedCategory, setSelectedCategory] = useState('housing');

    // Budget Calculator State
    const [calcCity, setCalcCity] = useState('Berlin');
    const [calcAccommodation, setCalcAccommodation] = useState('wg');
    const [calcLifestyle, setCalcLifestyle] = useState('comfortable');
    const [calcCooking, setCalcCooking] = useState('mostly');

    const convertCurrency = (amount) => {
        const converted = amount * CURRENCY_RATES[selectedCurrency];
        if (selectedCurrency === 'EUR') return `€${amount.toFixed(0)}`;
        if (selectedCurrency === 'USD') return `$${converted.toFixed(0)}`;
        if (selectedCurrency === 'GBP') return `£${converted.toFixed(0)}`;
        return `${converted.toFixed(0)} ${selectedCurrency}`;
    };

    const formatCurrency = (amount) => convertCurrency(amount);

    // Calculate budget based on selections
    const calculatedBudget = useMemo(() => {
        const cityData = CITIES_DATA.find(c => c.name === calcCity) || CITIES_DATA[0];
        const cityMultiplier = cityData.costIndex / 100;

        let rent = 400;
        if (calcAccommodation === 'dorm') rent = 280;
        else if (calcAccommodation === 'wg') rent = 400;
        else if (calcAccommodation === 'studio') rent = 550;

        rent = rent * cityMultiplier;

        let food = 180;
        if (calcCooking === 'always') food = 140;
        else if (calcCooking === 'mostly') food = 180;
        else if (calcCooking === 'sometimes') food = 250;
        else food = 350;

        let lifestyle = 1;
        if (calcLifestyle === 'budget') lifestyle = 0.8;
        else if (calcLifestyle === 'comfortable') lifestyle = 1;
        else lifestyle = 1.3;

        const insurance = 115;
        const transport = 25;
        const phone = 25;
        const leisure = 50 * lifestyle;
        const personal = 30 * lifestyle;
        const misc = 40 * lifestyle;

        const total = rent + food + insurance + transport + phone + leisure + personal + misc;

        return {
            rent: Math.round(rent),
            food: Math.round(food),
            insurance,
            transport,
            phone,
            leisure: Math.round(leisure),
            personal: Math.round(personal),
            misc: Math.round(misc),
            total: Math.round(total)
        };
    }, [calcCity, calcAccommodation, calcLifestyle, calcCooking]);

    const CHART_COLORS = ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

    const pieData = [
        { name: 'Rent', value: 45, color: '#1e40af' },
        { name: 'Food', value: 20, color: '#059669' },
        { name: 'Insurance', value: 12, color: '#dc2626' },
        { name: 'Transport', value: 5, color: '#d97706' },
        { name: 'Leisure', value: 8, color: '#7c3aed' },
        { name: 'Other', value: 10, color: '#6b7280' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab />;
            case 'states':
                return <StatesTab />;
            case 'cities':
                return <CitiesTab />;
            case 'categories':
                return <CategoriesTab />;
            case 'calculator':
                return <CalculatorTab />;
            case 'comparison':
                return <StateComparisonTable />;
            default:
                return <OverviewTab />;
        }
    };

    // ==================== TAB COMPONENTS ====================

    const OverviewTab = () => {
        const [showMapModal, setShowMapModal] = useState(false);

        return (
            <div className="space-y-12">
                {/* Quick Stats - enhanced grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard
                        icon="💰"
                        label="Avg Monthly Budget"
                        value={formatCurrency(950)}
                        subtext="Student average"
                    />
                    <StatCard
                        icon="🏠"
                        label="Avg Rent (WG Room)"
                        value={formatCurrency(420)}
                        subtext="Warm rent included"
                    />
                    <StatCard
                        icon="⬇️"
                        label="Cheapest City"
                        value="Chemnitz"
                        subtext={formatCurrency(608) + "/month"}
                    />
                    <StatCard
                        icon="⬆️"
                        label="Most Expensive"
                        value="Munich"
                        subtext={formatCurrency(1150) + "/month"}
                    />
                </div>

                {/* Cost Heatmap Map - Enhanced Design */}
                <div className="relative bg-gradient-to-br from-white via-white to-slate-50 rounded-3xl p-8 shadow-lg border border-gray-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-100/50 to-transparent rounded-full blur-3xl" />

                    <div className="relative flex flex-col lg:flex-row items-center gap-10">
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-4">
                                    <span>🗺️</span>
                                    <span>Interactive Map</span>
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Cost of Living Heatmap</h2>
                                <p className="mt-3 text-gray-600 leading-relaxed">
                                    Visualize cost differences across all 16 German states. Western and Southern states typically have higher living costs compared to Eastern regions.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm" />
                                    <span className="text-sm font-medium text-gray-700">Most Affordable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-sm" />
                                    <span className="text-sm font-medium text-gray-700">Moderate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-sm" />
                                    <span className="text-sm font-medium text-gray-700">Expensive</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex justify-center relative">
                            <div
                                className="group relative cursor-zoom-in"
                                onClick={() => setShowMapModal(true)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                                <img
                                    src={germanyHeatmap}
                                    alt="Germany Cost of Living Heatmap"
                                    className="relative max-w-full h-auto max-h-96 object-contain drop-shadow-xl transition-all duration-500 group-hover:scale-[1.02] rounded-xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-end justify-center pb-4 pointer-events-none">
                                    <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                        Click to enlarge
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Modal */}
                {showMapModal && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
                        onClick={() => setShowMapModal(false)}
                    >
                        <div className="relative max-w-5xl w-full max-h-[90vh]">
                            <button
                                onClick={() => setShowMapModal(false)}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
                            >
                                <span className="text-4xl text-white font-bold">&times;</span>
                            </button>
                            <img
                                src={germanyHeatmap}
                                alt="Germany Cost of Living Heatmap Full Size"
                                className="w-full h-full object-contain rounded-lg shadow-2xl bg-white"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}

                {/* Budget Distribution Pie Chart - Enhanced */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Where Your Money Goes</h2>
                                <p className="text-gray-500 text-sm mt-1">Typical monthly budget distribution</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${value}%`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Budget Tiers - Enhanced */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Budget Tiers</h2>
                                <p className="text-gray-500 text-sm mt-1">Choose your lifestyle level</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                                <span className="text-lg">🎯</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {BUDGET_TIERS.map((tier, idx) => (
                                <div
                                    key={idx}
                                    className="group p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer"
                                    style={{
                                        borderColor: tier.color + '30',
                                        backgroundColor: tier.color + '08',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: tier.color }}
                                            />
                                            <span className="font-bold text-lg" style={{ color: tier.color }}>{tier.name}</span>
                                        </div>
                                        <span className="text-xl font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">{tier.range}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3">{tier.description}</p>
                                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                                            style={{
                                                width: `${(tier.monthly / 1400) * 100}%`,
                                                background: `linear-gradient(90deg, ${tier.color}90, ${tier.color})`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Student Life & Savings Section - Redesigned */}
                <div className="grid gap-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <span className="text-2xl">💡</span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Maximizing Your Budget</h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Money Saving Tips */}
                        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>💰</span> Top Money-Saving Tips
                            </h3>
                            <div className="grid gap-4">
                                {MONEY_SAVING_TIPS.slice(0, 6).map((item, idx) => (
                                    <div key={idx} className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300 flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                                            <span className="text-green-600 font-bold text-sm">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1">{item.tip}</p>
                                            <p className="text-sm text-green-700 font-medium bg-green-50 inline-block px-2 py-0.5 rounded-md">
                                                {item.impact}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Working While Studying */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-10 -mb-10" />

                                <div className="relative">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <span>👷</span> Working While Studying
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                            <p className="text-3xl font-bold mb-1">120</p>
                                            <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider">Full Days/Year</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                            <p className="text-3xl font-bold mb-1">€538</p>
                                            <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider">Tax-Free Limit</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                            <p className="text-3xl font-bold mb-1">€12.41</p>
                                            <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider">Min Wage/Hr</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                            <p className="text-3xl font-bold mb-1">20h</p>
                                            <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider">Max Wk Hours</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
                                        <p className="text-sm text-indigo-100 leading-relaxed">
                                            <strong>Popular Jobs:</strong> Research assistant (HiWi), tutoring, retail, hospitality, execution courier.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex-1">
                                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                    <span>⚠️</span> Important Note
                                </h3>
                                <p className="text-amber-800 text-sm leading-relaxed">
                                    Non-EU students can work 120 full days or 240 half days per year. Self-employment usually requires special permission from the Foreigners' Authority.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Rent Trends Chart - Enhanced */}
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Rent Price Trends</h3>
                            <p className="text-gray-500 text-sm mt-1">Average monthly rent for student accommodation (2019-2024)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-semibold text-gray-700">Live Data</span>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={RENT_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMunich" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={(v) => `€${v}`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => [`€${value}`, '']}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="munich"
                                    name="Munich"
                                    stroke="#dc2626"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="berlin"
                                    name="Berlin"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="leipzig"
                                    name="Leipzig"
                                    stroke="#16a34a"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avg"
                                    name="National Avg"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resources & Glossary Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Useful Resources */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>🔗</span> Essential Resources
                        </h3>
                        <div className="grid gap-3">
                            {[
                                { title: 'Housing Search', sites: ['WG-Gesucht.de', 'ImmobilienScout24', 'Studierendenwerk'], icon: '🏠', color: 'bg-blue-50 text-blue-600' },
                                { title: 'Insurance', sites: ['Check24', 'Verivox', 'TK', 'AOK'], icon: '🏥', color: 'bg-red-50 text-red-600' },
                                { title: 'Student Jobs', sites: ['Studentenjob.de', 'Jobmensa', 'Indeed'], icon: '💼', color: 'bg-amber-50 text-amber-600' },
                                { title: 'Funding', sites: ['Scholarships', 'BAföG', 'Stipendienlotse'], icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
                            ].map((category, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-gray-50/50">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center text-xl shrink-0`}>
                                            {category.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-sm mb-2">{category.title}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {category.sites.map((site, sIdx) => (
                                                    <a
                                                        key={sIdx}
                                                        href="#"
                                                        onClick={(e) => e.preventDefault()}
                                                        className="text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-white px-2.5 py-1 rounded-md border border-gray-200 transition-all flex items-center gap-1 group"
                                                    >
                                                        {site}
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Interactive Glossary */}
                        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>📖</span> Key German Terms
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { de: 'Warmmiete', en: 'Total rent including heating & utilities' },
                                    { de: 'Kaltmiete', en: 'Base rent excluding additional costs' },
                                    { de: 'Kaution', en: 'Security deposit (usually 2-3 months rent)' },
                                    { de: 'Nebenkosten', en: 'Utilities & service charges' },
                                    { de: 'WG (Wohngemeinschaft)', en: 'Shared flat/apartment' },
                                ].map((term, idx) => (
                                    <div key={idx} className="group flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-help border border-transparent hover:border-gray-100">
                                        <span className="font-bold text-gray-900">{term.de}</span>
                                        <span className="text-sm text-gray-500 text-right group-hover:text-blue-600 transition-colors">{term.en}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* East vs West Card */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                🇩🇪 Regional Differences
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">East</div>
                                    <div className="text-emerald-400 font-bold">20-40% cheaper</div>
                                    <div className="text-xs text-slate-300 mt-1">Lower rent & services</div>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">West</div>
                                    <div className="text-blue-400 font-bold">Higher Salaries</div>
                                    <div className="text-xs text-slate-300 mt-1">More job hubs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getEnrichedStateData = (state) => {
        const costFactor = state.costIndex / 100;

        // Base costs estimation
        const groceries = Math.round(200 * costFactor);
        const health = 125; // Average public student insurance
        const transport = 49; // Deutschland-Ticket
        const leisure = Math.round(75 * costFactor);
        const misc = Math.round(60 * costFactor);
        const total = state.avgRent + groceries + health + transport + leisure + misc;

        return {
            ...state,
            breakdown: {
                rent: state.avgRent,
                groceries,
                health,
                transport,
                leisure,
                misc,
                total
            }
        };
    };

    const StateComparisonTable = () => {
        const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
        const [expandedRow, setExpandedRow] = useState(null);

        const enrichedStates = useMemo(() => {
            let data = GERMAN_STATES.map(getEnrichedStateData);

            if (sortConfig.key) {
                data.sort((a, b) => {
                    let valA, valB;
                    if (['total', 'rent', 'groceries'].includes(sortConfig.key)) {
                        valA = a.breakdown[sortConfig.key] || a.breakdown.total;
                        valB = b.breakdown[sortConfig.key] || b.breakdown.total;
                    } else if (sortConfig.key === 'name') {
                        valA = a.name;
                        valB = b.name;
                    } else if (sortConfig.key === 'costIndex') {
                        valA = a.costIndex;
                        valB = b.costIndex;
                    }

                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            return data;
        }, [sortConfig]);

        const handleSort = (key) => {
            setSortConfig(current => ({
                key,
                direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
            }));
        };

        const SortIcon = ({ column }) => {
            if (sortConfig.key !== column) return <span className="text-gray-300 ml-1">↕</span>;
            return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
        };

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900">Detailed State Cost Comparison</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Comprehensive breakdown of monthly living costs across all 16 states.
                            Click on a row to see city-specific details.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/80 transition-colors group" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-2">
                                            State <SortIcon column="name" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100/80 transition-colors group" onClick={() => handleSort('rent')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Avg Rent <SortIcon column="rent" />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-right cursor-pointer hover:bg-gray-100/80 transition-colors group" onClick={() => handleSort('groceries')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Groceries <SortIcon column="groceries" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right hidden md:table-cell text-gray-400 font-medium">
                                        Transport
                                    </th>
                                    <th className="px-6 py-4 text-right hidden md:table-cell text-gray-400 font-medium">
                                        Health
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-blue-50/80 transition-colors bg-blue-50/30 group" onClick={() => handleSort('total')}>
                                        <div className="flex items-center justify-end gap-2 text-blue-700">
                                            Est. Total <SortIcon column="total" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enrichedStates.map((state) => (
                                    <React.Fragment key={state.id}>
                                        <tr
                                            onClick={() => setExpandedRow(expandedRow === state.id ? null : state.id)}
                                            className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${expandedRow === state.id ? 'bg-blue-50/50' : 'bg-white'}`}
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: state.color }}
                                                />
                                                {state.name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-700">
                                                {formatCurrency(state.breakdown.rent)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                {formatCurrency(state.breakdown.groceries)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600 hidden md:table-cell">
                                                {formatCurrency(state.breakdown.transport)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600 hidden md:table-cell">
                                                {formatCurrency(state.breakdown.health)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30">
                                                {formatCurrency(state.breakdown.total)}
                                            </td>
                                            <td className="px-4 py-4 text-gray-400">
                                                {expandedRow === state.id ? '▼' : '▶'}
                                            </td>
                                        </tr>

                                        {/* Nested Expansion Table */}
                                        {expandedRow === state.id && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan="7" className="px-6 py-6 border-b border-gray-100 shadow-inner">
                                                    <div className="grid md:grid-cols-2 gap-8 animate-slide-down">

                                                        {/* Left: Detailed Breakdown */}
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                                📊 Cost Breakdown for {state.name}
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🏠</span>
                                                                        <span>Accommodation (WG/Dorm)</span>
                                                                    </div>
                                                                    <span className="font-medium">{formatCurrency(state.breakdown.rent)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🍎</span>
                                                                        <span>Food & Groceries</span>
                                                                    </div>
                                                                    <span className="font-medium">{formatCurrency(state.breakdown.groceries)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🏥</span>
                                                                        <span>Health Insurance</span>
                                                                    </div>
                                                                    <span className="font-medium">{formatCurrency(state.breakdown.health)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🚌</span>
                                                                        <span>Transport (Deutschland-Ticket)</span>
                                                                    </div>
                                                                    <span className="font-medium">{formatCurrency(state.breakdown.transport)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-gray-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🎉</span>
                                                                        <span>Leisure & Misc</span>
                                                                    </div>
                                                                    <span className="font-medium">{formatCurrency(state.breakdown.leisure + state.breakdown.misc)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                                                                    <span className="font-bold text-blue-900">Total Monthly Est.</span>
                                                                    <span className="font-bold text-blue-700 text-lg">{formatCurrency(state.breakdown.total)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right: Cities & Quick Stats */}
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                                🏙️ Major Student Cities
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                                {state.cities.map((city, idx) => (
                                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-center font-medium text-gray-700 hover:border-blue-300 transition-colors">
                                                                        {city}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <h4 className="font-bold text-gray-800 mb-3 text-sm">Quick Facts</h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                                    <span className="text-indigo-600 text-xs font-bold uppercase">Cost Index</span>
                                                                    <div className="text-2xl font-bold text-indigo-900 mt-1">{state.costIndex}</div>
                                                                    <span className="text-xs text-indigo-700">National Avg: 100</span>
                                                                </div>
                                                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                                    <span className="text-purple-600 text-xs font-bold uppercase">Universities</span>
                                                                    <div className="text-2xl font-bold text-purple-900 mt-1">{state.universities}</div>
                                                                    <span className="text-xs text-purple-700">Institutions</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const StatesTab = () => {
        return (
            <div className="space-y-8">
                {/* States Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GERMAN_STATES.map((state) => {
                        const enriched = getEnrichedStateData(state);
                        return (
                            <div key={state.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                                            style={{ backgroundColor: state.color }}
                                        >
                                            {state.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{state.name}</h3>
                                            <p className="text-sm text-gray-500">{state.cities.length} Major Cities</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Total</p>
                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(enriched.breakdown.total)}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Avg Rent
                                        </span>
                                        <span className="font-semibold text-gray-900">{formatCurrency(enriched.breakdown.rent)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(enriched.breakdown.rent / 800) * 100}%`, backgroundColor: state.color }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-1">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Cost Index
                                        </span>
                                        <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{state.costIndex}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {state.cities.slice(0, 3).map((city, idx) => (
                                        <span key={idx} className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                            {city}
                                        </span>
                                    ))}
                                    {state.cities.length > 3 && (
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">+{state.cities.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                <StateComparisonTable />
            </div>
        );
    };

    const CitiesTab = () => {
        const sortedCities = [...CITIES_DATA].sort((a, b) => a.total - b.total);

        return (
            <div className="space-y-6">
                {/* City Selector */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Compare Cities (Select 2-4)</h4>
                    <div className="flex flex-wrap gap-2">
                        {CITIES_DATA.slice(0, 15).map((city) => (
                            <button
                                key={city.name}
                                onClick={() => {
                                    if (selectedCities.includes(city.name)) {
                                        setSelectedCities(selectedCities.filter(c => c !== city.name));
                                    } else if (selectedCities.length < 4) {
                                        setSelectedCities([...selectedCities, city.name]);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCities.includes(city.name)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comparison Table */}
                {selectedCities.length >= 2 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">Side-by-Side Comparison</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                                        {selectedCities.map((cityName, idx) => (
                                            <th key={cityName} className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                <span style={{ color: CHART_COLORS[idx] }}>{cityName}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {['rent', 'groceries', 'dining', 'leisure', 'total'].map((field) => {
                                        const cityValues = selectedCities.map(name => {
                                            const city = CITIES_DATA.find(c => c.name === name);
                                            return city ? city[field] : 0;
                                        });
                                        const minVal = Math.min(...cityValues);

                                        return (
                                            <tr key={field} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-700 capitalize">
                                                    {field === 'total' ? 'Total Monthly' : field}
                                                </td>
                                                {selectedCities.map((cityName) => {
                                                    const city = CITIES_DATA.find(c => c.name === cityName);
                                                    const value = city ? city[field] : 0;
                                                    const isLowest = value === minVal && cityValues.filter(v => v === minVal).length === 1;

                                                    return (
                                                        <td key={cityName} className="px-4 py-3 text-center">
                                                            <span className={`font-bold ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
                                                                {formatCurrency(value)}
                                                                {isLowest && <span className="ml-1 text-xs">✓</span>}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Cost Index</td>
                                        {selectedCities.map((cityName) => {
                                            const city = CITIES_DATA.find(c => c.name === cityName);
                                            const index = city ? city.costIndex : 100;
                                            return (
                                                <td key={cityName} className="px-4 py-3 text-center">
                                                    <span className={`font-bold ${index > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {index > 100 ? '↑' : '↓'} {index}%
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Cities Ranking */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cities by Affordability</h3>
                    <p className="text-gray-500 text-sm mb-6">Total monthly cost (rent + essentials)</p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedCities.slice(0, 15)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={(v) => `€${v}`} domain={[500, 1200]} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value, name) => [`€${value}`, name]}
                                    contentStyle={{ borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="rent" name="Rent" stackId="a" fill="#1e40af" />
                                <Bar dataKey="groceries" name="Groceries" stackId="a" fill="#059669" />
                                <Bar dataKey="dining" name="Dining" stackId="a" fill="#d97706" />
                                <Bar dataKey="leisure" name="Leisure" stackId="a" fill="#7c3aed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* City Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedCities.slice(0, 12).map((city, idx) => (
                        <div key={city.name} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${idx < 4 ? 'bg-green-100 text-green-700' :
                                        idx < 8 ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        #{idx + 1} {idx < 4 ? 'Affordable' : idx < 8 ? 'Moderate' : 'Expensive'}
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{formatCurrency(city.total)}</span>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">{city.name}</h4>
                            <p className="text-sm text-gray-500 mb-3">{city.state}</p>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-gray-50 rounded-lg p-2">
                                    <span className="text-gray-500">Rent</span>
                                    <p className="font-bold">{formatCurrency(city.rent)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                    <span className="text-gray-500">Food</span>
                                    <p className="font-bold">{formatCurrency(city.groceries)}</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span>👨‍🎓 {(city.studentPop / 1000).toFixed(0)}k students</span>
                                <span>⭐ {city.popularity}% popular</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CategoriesTab = () => (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    {
                        category: 'Housing',
                        icon: '🏠',
                        avg: '450 €',
                        color: 'bg-blue-50 text-blue-600',
                        items: [
                            { name: 'WG Room (Shared)', avg: '350-500 €' },
                            { name: 'Studio Apt', avg: '600-900 €' },
                            { name: 'Utilities', avg: 'Included/See Contract' },
                            { name: 'Internet', avg: '30-45 €' }
                        ]
                    },
                    {
                        category: 'Food & Groceries',
                        icon: '🍎',
                        avg: '200 €',
                        color: 'bg-green-50 text-green-600',
                        items: [
                            { name: 'Discount Supermarket', avg: 'ALDI, Lidl, Netto' },
                            { name: 'University Mensa', avg: '3-5 € / meal' },
                            { name: 'Restaurant Meal', avg: '12-20 €' },
                            { name: 'Coffee', avg: '2.50-4.00 €' }
                        ]
                    },
                    {
                        category: 'Transportation',
                        icon: '🚌',
                        avg: '49 €',
                        color: 'bg-indigo-50 text-indigo-600',
                        items: [
                            { name: 'Deutschland-Ticket', avg: '49 € / month' },
                            { name: 'Semester Ticket', avg: 'Included in fees' },
                            { name: 'Bike Rental', avg: '10-20 € / month' },
                            { name: 'Train (ICE)', avg: 'Varies (Book early)' }
                        ]
                    },
                    {
                        category: 'Health & Insurance',
                        icon: '🏥',
                        avg: '120 €',
                        color: 'bg-red-50 text-red-600',
                        items: [
                            { name: 'Public Insurance', avg: '~120-130 €' },
                            { name: 'Private (Expat)', avg: 'Varies' },
                            { name: 'Liability Ins.', avg: '5 € / month' },
                            { name: 'Meds Co-pay', avg: '5-10 €' }
                        ]
                    },
                    {
                        category: 'Leisure & Lifestyle',
                        icon: '🎉',
                        avg: '100 €',
                        color: 'bg-amber-50 text-amber-600',
                        items: [
                            { name: 'Gym Membership', avg: '20-40 €' },
                            { name: 'Cinema Ticket', avg: '10-15 €' },
                            { name: 'Club Entry', avg: '10-20 €' },
                            { name: 'Mobile Plan', avg: '10-30 €' }
                        ]
                    },
                    {
                        category: 'Study Materials',
                        icon: '📚',
                        avg: '30 €',
                        color: 'bg-purple-50 text-purple-600',
                        items: [
                            { name: 'Semester Contrib.', avg: '150-350 € / sem' },
                            { name: 'Books/Scripts', avg: 'Varies' },
                            { name: 'Printing', avg: '5-10 €' },
                            { name: 'Software', avg: 'Usually Free' }
                        ]
                    },
                ].map((cat, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-2xl shadow-inner`}>
                                {cat.icon}
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Monthly</span>
                                <div className="text-2xl font-bold text-gray-900">{cat.avg}</div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{cat.category}</h3>
                        <div className="space-y-3">
                            {cat.items.map((item, iIdx) => (
                                <div key={iIdx} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-gray-100 transition-all">
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                    <span className="text-gray-500 bg-gray-100 group-hover:bg-gray-50 px-2 py-0.5 rounded text-xs">{item.avg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const CalculatorTab = () => {
        const budgetPieData = [
            { name: 'Rent', value: calculatedBudget.rent },
            { name: 'Food', value: calculatedBudget.food },
            { name: 'Insurance', value: calculatedBudget.insurance },
            { name: 'Transport', value: calculatedBudget.transport },
            { name: 'Phone', value: calculatedBudget.phone },
            { name: 'Leisure', value: calculatedBudget.leisure },
            { name: 'Personal', value: calculatedBudget.personal },
            { name: 'Misc', value: calculatedBudget.misc }
        ];

        return (
            <div className="space-y-8">
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Calculator Controls */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">🧮</span>
                                Budget Estimator
                            </h3>

                            <div className="space-y-8">
                                {/* City Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Target City</label>
                                    <select
                                        value={calcCity}
                                        onChange={(e) => setCalcCity(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-700 bg-gray-50/50"
                                    >
                                        {CITIES_DATA.map((city) => (
                                            <option key={city.name} value={city.name}>
                                                {city.name} ({city.state}) - Index: {city.costIndex}%
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Accommodation */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Housing Preference</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'dorm', label: 'Dormitory', icon: '🏢' },
                                            { id: 'wg', label: 'WG Room', icon: '🏠' },
                                            { id: 'studio', label: 'Studio', icon: '🏡' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCalcAccommodation(opt.id)}
                                                className={`p-4 rounded-xl border-2 transition-all ${calcAccommodation === opt.id
                                                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                                                    : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">{opt.icon}</div>
                                                <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lifestyle */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Lifestyle</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'budget', label: 'Frugal', color: 'red', desc: 'Minimal costs' },
                                            { id: 'comfortable', label: 'Standard', color: 'amber', desc: 'Balanced' },
                                            { id: 'relaxed', label: 'Relaxed', color: 'green', desc: 'More freedom' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCalcLifestyle(opt.id)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${calcLifestyle === opt.id
                                                    ? `border-${opt.color}-500 bg-${opt.color}-50 ring-1 ring-${opt.color}-500`
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                style={{
                                                    borderColor: calcLifestyle === opt.id ?
                                                        (opt.color === 'red' ? '#ef4444' : opt.color === 'amber' ? '#f59e0b' : '#22c55e') :
                                                        undefined,
                                                    backgroundColor: calcLifestyle === opt.id ?
                                                        (opt.color === 'red' ? '#fef2f2' : opt.color === 'amber' ? '#fffbeb' : '#f0fdf4') :
                                                        undefined
                                                }}
                                            >
                                                <div className="font-bold text-gray-900">{opt.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cooking Habits */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Food & Dining</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'always', label: 'Cook at Home', desc: 'Rarely eat out' },
                                            { id: 'mostly', label: 'Mostly Cook', desc: 'Eat out 1-2x/week' },
                                            { id: 'sometimes', label: 'Mix', desc: 'Eat out 3-4x/week' },
                                            { id: 'rarely', label: 'Eat Out', desc: 'Mostly restaurants' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCalcCooking(opt.id)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${calcCooking === opt.id
                                                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                                                    : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                                                <div className="text-xs text-gray-500">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="sticky top-24">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16 group-hover:opacity-30 transition-opacity duration-700"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -ml-12 -mb-12 group-hover:opacity-30 transition-opacity duration-700"></div>

                                <h4 className="text-slate-400 font-medium uppercase tracking-widest text-xs mb-2 flex justify-between">
                                    <span>Estimated Monthly Budget</span>
                                    <span>{calcCity}</span>
                                </h4>
                                <div className="text-5xl lg:text-6xl font-black mb-8 tracking-tight flex items-baseline gap-2">
                                    {formatCurrency(calculatedBudget.total)}
                                    <span className="text-xl lg:text-2xl text-slate-400 font-normal">/mo</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="text-slate-300">Base Rent</span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(calculatedBudget.rent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                            <span className="text-slate-300">Daily Living</span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(calculatedBudget.food + calculatedBudget.leisure + calculatedBudget.personal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                            <span className="text-slate-300">Fixed Costs</span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(calculatedBudget.insurance + calculatedBudget.transport + calculatedBudget.phone)}</span>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        <strong>Pro Tip:</strong> Most students in {calcCity} spend around {formatCurrency(Math.round(calculatedBudget.total * 0.9))} - {formatCurrency(Math.round(calculatedBudget.total * 1.1))}.
                                        Keep a buffer of ~100€ for emergencies.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-4 text-center">Cost Distribution</h4>
                                <div className="h-48 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={budgetPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {budgetPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Total</span>
                                            <span className="text-xl font-bold text-gray-900">{formatCurrency(calculatedBudget.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({ icon, label, value, subtext }) => (
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center">
                        <span className="text-xl">{icon}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-20">
            <SEO
                title="Cost of Living in Germany"
                description="Comprehensive guide to student living costs in Germany. Compare rent, food, and transport expenses across 16 states and major cities."
                keywords={['cost of living germany', 'student budget germany', 'rent in germany', 'student cities germany', 'living expenses germany']}
            />

            {/* Graph for AEO (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Article",
                            "headline": "Cost of Living in Germany for International Students",
                            "description": "Comprehensive guide to monthly expenses, rent, and student budget in Germany for 2024.",
                            "author": { "@type": "Organization", "name": "CampusConsult" },
                            "publisher": { "@type": "Organization", "name": "CampusConsult" }
                        },
                        {
                            "@type": "FAQPage",
                            "mainEntity": [
                                { "@type": "Question", "name": "What is the average cost of living in Germany for students?", "acceptedAnswer": { "@type": "Answer", "text": "The average monthly cost of living for students in Germany is approximately €950, which includes rent, food, transport, and health insurance." } },
                                { "@type": "Question", "name": "What is the cheapest student city in Germany?", "acceptedAnswer": { "@type": "Answer", "text": "Chemnitz is currently one of the most affordable student cities, with estimated monthly costs around €608." } },
                                { "@type": "Question", "name": "How much is student rent in Germany?", "acceptedAnswer": { "@type": "Answer", "text": "Average student rent ranges from €300 in smaller cities to over €650 in Munich for a shared room (WG)." } }
                            ]
                        }
                    ]
                })}
            </script>

            {/* Hero Header */}
            <div className="relative overflow-hidden">
                {/* Background with premium gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

                {/* Decorative gradient orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                    {/* Main header content */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl blur-lg opacity-50" />
                                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-white/10">
                                    <span className="text-5xl">🇩🇪</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30 backdrop-blur-sm">
                                        2024/25 Updated
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                                    Cost of Living
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                                        in Germany
                                    </span>
                                </h1>
                                <p className="mt-3 text-lg text-slate-300 max-w-xl">
                                    Comprehensive financial planning guide for international students — compare expenses across all 16 states and major university cities
                                </p>
                            </div>
                        </div>

                        {/* Currency Selector - Enhanced */}
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm font-medium">Display Currency</span>
                            <div className="relative">
                                <select
                                    value={selectedCurrency}
                                    onChange={(e) => setSelectedCurrency(e.target.value)}
                                    className="appearance-none bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer hover:bg-white/10"
                                >
                                    {Object.keys(CURRENCY_RATES).map((curr) => (
                                        <option key={curr} value={curr} className="bg-slate-900 text-white">
                                            {curr}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:bg-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <span className="text-lg">💰</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. Monthly</p>
                                </div>
                                <p className="text-3xl font-bold text-white">{formatCurrency(950)}</p>
                                <p className="text-xs text-slate-500 mt-1">Student budget</p>
                            </div>
                        </div>

                        <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:bg-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <span className="text-lg">📍</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Most Affordable</p>
                                </div>
                                <p className="text-3xl font-bold text-white">Chemnitz</p>
                                <p className="text-xs text-emerald-400 mt-1">≈ {formatCurrency(608)}/mo</p>
                            </div>
                        </div>

                        <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:bg-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                        <span className="text-lg">🏙️</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Most Expensive</p>
                                </div>
                                <p className="text-3xl font-bold text-white">Munich</p>
                                <p className="text-xs text-amber-400 mt-1">≈ {formatCurrency(1150)}/mo</p>
                            </div>
                        </div>

                        <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:bg-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <span className="text-lg">🎓</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Coverage</p>
                                </div>
                                <p className="text-3xl font-bold text-white">16 States</p>
                                <p className="text-xs text-purple-400 mt-1">400+ universities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto gap-2 py-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'states', label: 'By State', icon: '🗺️' },
                            { id: 'comparison', label: 'Detailed Comparison', icon: '⚖️' },
                            { id: 'cities', label: 'By City', icon: '🏙️' },
                            { id: 'categories', label: 'Categories', icon: '📋' },
                            { id: 'calculator', label: 'Budget Calculator', icon: '🧮' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <span className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {renderTabContent()}
            </div>


        </div >
    );
};

export default GermanyCostOfLiving;