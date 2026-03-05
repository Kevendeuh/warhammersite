const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory and db.json exist
function ensureDB() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], figurines: [], orders: [] }, null, 2));
    }
}

function readDB() {
    ensureDB();
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
    ensureDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getCollection(name) {
    const db = readDB();
    return db[name] || [];
}

function saveCollection(name, collection) {
    const db = readDB();
    db[name] = collection;
    writeDB(db);
}

function findById(collectionName, id) {
    return getCollection(collectionName).find(item => item.id === id) || null;
}

function findByField(collectionName, field, value) {
    return getCollection(collectionName).find(item => item[field] === value) || null;
}

function insertOne(collectionName, document) {
    const collection = getCollection(collectionName);
    collection.push(document);
    saveCollection(collectionName, collection);
    return document;
}

function updateOne(collectionName, id, updates) {
    const collection = getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;
    collection[index] = { ...collection[index], ...updates };
    saveCollection(collectionName, collection);
    return collection[index];
}

module.exports = { getCollection, saveCollection, findById, findByField, insertOne, updateOne };
