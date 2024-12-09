const sql = require("mssql");

var config = {
    "user": "Lucy",
    "password": "0909771013",
    "server": "MSI\\SQLEXPRESS",
    "database": "borrowing_system", 
    "options": {
    "encrypt": false
    }
}

let poolPromise;
async function connectDB() {
    if (!poolPromise) {
        try {
            poolPromise = new sql.ConnectionPool(config)
                .connect()
                .then((pool) => {
                    console.log("Database connected successfully!");
                    return pool;
                });
        } catch (err) {
            console.error("Database connection failed:", err);
            throw err;
        }
    }
    return poolPromise;
}

//查詢
async function queryDB(query) {
    const pool = await connectDB();
    return pool.request().query(query);
}

//寫入
async function executeQuery(query, params = {}) {
    const pool = await connectDB();//連接到資料庫
    const request = pool.request();

    //將參數綁定到指令中
    for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
    }

    return request.query(query);
}

module.exports = { connectDB, queryDB, executeQuery,};//導出函式
