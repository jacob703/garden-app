// Brisbane subtropical climate planting guide.
// months: 0=Jan ... 11=Dec — months good to SOW in Brisbane.
// wateringDays: how often (in days) this plant needs watering.
// daysToHarvest: days from planting to first harvest.
// sun: sun requirement.

const PLANTS = [
  { name: "Tomato", emoji: "🍅", months: [1, 6, 7], wateringDays: 2, daysToHarvest: 80, sun: "Full sun" },
  { name: "Basil", emoji: "🌿", months: [0, 7, 8, 9, 10, 11], wateringDays: 2, daysToHarvest: 60, sun: "Full sun" },
  { name: "Capsicum", emoji: "🫑", months: [1, 2, 7, 8], wateringDays: 3, daysToHarvest: 90, sun: "Full sun" },
  { name: "Chilli", emoji: "🌶️", months: [1, 2, 7, 8], wateringDays: 3, daysToHarvest: 90, sun: "Full sun" },
  { name: "Cucumber", emoji: "🥒", months: [1, 2, 8, 9], wateringDays: 2, daysToHarvest: 60, sun: "Full sun" },
  { name: "Zucchini", emoji: "🥒", months: [1, 2, 8, 9], wateringDays: 2, daysToHarvest: 50, sun: "Full sun" },
  { name: "Sweet corn", emoji: "🌽", months: [1, 2, 8, 9], wateringDays: 3, daysToHarvest: 80, sun: "Full sun" },
  { name: "Sweet potato", emoji: "🍠", months: [8, 9, 10], wateringDays: 5, daysToHarvest: 120, sun: "Full sun" },
  { name: "Beetroot", emoji: "🥬", months: [1, 2, 3, 7, 8, 9], wateringDays: 3, daysToHarvest: 60, sun: "Full sun" },
  { name: "Broccoli", emoji: "🥦", months: [1, 2, 3, 4], wateringDays: 3, daysToHarvest: 80, sun: "Full sun" },
  { name: "Cabbage", emoji: "🥬", months: [1, 2, 3, 4], wateringDays: 3, daysToHarvest: 90, sun: "Full sun" },
  { name: "Carrot", emoji: "🥕", months: [1, 2, 3, 4, 8, 9], wateringDays: 3, daysToHarvest: 75, sun: "Full sun" },
  { name: "Lettuce", emoji: "🥬", months: [1, 2, 3, 4, 5, 6, 7, 8], wateringDays: 2, daysToHarvest: 45, sun: "Part shade" },
  { name: "Onion", emoji: "🧅", months: [2, 3, 4, 5], wateringDays: 4, daysToHarvest: 150, sun: "Full sun" },
  { name: "Pea", emoji: "🫛", months: [2, 3, 4, 5], wateringDays: 3, daysToHarvest: 65, sun: "Full sun" },
  { name: "Radish", emoji: "🌰", months: [1, 2, 3, 4, 5, 6, 7, 8], wateringDays: 2, daysToHarvest: 30, sun: "Full sun" },
  { name: "Silverbeet", emoji: "🥬", months: [1, 2, 3, 4, 5, 6, 7, 8], wateringDays: 3, daysToHarvest: 55, sun: "Full sun" },
  { name: "Spinach", emoji: "🥬", months: [2, 3, 4, 5], wateringDays: 3, daysToHarvest: 45, sun: "Part shade" },
  { name: "Garlic", emoji: "🧄", months: [3, 4], wateringDays: 5, daysToHarvest: 180, sun: "Full sun" },
  { name: "Potato", emoji: "🥔", months: [6], wateringDays: 4, daysToHarvest: 100, sun: "Full sun" },
  { name: "Ginger", emoji: "🫚", months: [7, 8], wateringDays: 3, daysToHarvest: 240, sun: "Part shade" },
  { name: "Rockmelon", emoji: "🍈", months: [8, 9], wateringDays: 2, daysToHarvest: 90, sun: "Full sun" },
  { name: "Watermelon", emoji: "🍉", months: [8, 9], wateringDays: 2, daysToHarvest: 90, sun: "Full sun" },
  { name: "Pumpkin", emoji: "🎃", months: [8, 9, 10], wateringDays: 3, daysToHarvest: 110, sun: "Full sun" },
  { name: "Snow pea", emoji: "🫛", months: [2, 3, 4, 5], wateringDays: 3, daysToHarvest: 60, sun: "Full sun" },
  { name: "Rosemary", emoji: "🌿", months: [2, 3, 8, 9], wateringDays: 6, daysToHarvest: 80, sun: "Full sun" },
  { name: "Coriander", emoji: "🌿", months: [2, 3, 4, 8, 9], wateringDays: 3, daysToHarvest: 45, sun: "Part shade" },
  { name: "Mint", emoji: "🌿", months: [1, 2, 3, 8, 9], wateringDays: 3, daysToHarvest: 60, sun: "Part shade" },
  { name: "Parsley", emoji: "🌿", months: [1, 2, 3, 8, 9], wateringDays: 3, daysToHarvest: 70, sun: "Part shade" },
  { name: "Eggplant", emoji: "🍆", months: [1, 2, 7, 8], wateringDays: 3, daysToHarvest: 100, sun: "Full sun" },
];
