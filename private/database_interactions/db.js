import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
	filename: "ShoppingList.db",
	driver: sqlite3.Database,
});

await db.exec(`
    drop table item;
    CREATE TABLE IF NOT EXISTS item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isBought INTEGER NOT NULL
                            DEFAULT 0,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > -1),
        unit TEXT NOT NULL,
        price INTEGER DEFAULT 0,
        isBeingEdited INTEGER DEFAULT 0,
        categoryId INTEGER REFERENCES category (id)
    );

    drop table market;
    CREATE TABLE IF NOT EXISTS market (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    );

    drop table category;
    CREATE TABLE IF NOT EXISTS category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK (
            name IN (
                'Undefined Category', 
                'Fruit and Veggies', 
                'Meat', 
                'Cheese and Milk', 
                'Breads and Snacks', 
                'Household objects', 
                'Drinks'
            )
        ),
        marketId INTEGER REFERENCES market (id) 
    );
`);

export default db;