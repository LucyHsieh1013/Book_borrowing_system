const sql = require("mssql");

// SQL Server configuration
var config = {
    "user": "Lucy", // Database username
    "password": "0909771013", // Database password
    "server": "MSI\\SQLEXPRESS", // Server IP address
    "database": "borrowing_system", // Database name
    "options": {
    "encrypt": false // Disable encryption
    }
}
// Connect to SQL Server
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
    const pool = await connectDB();
    const request = pool.request();

    // Bind parameters to the query
    for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
    }

    return request.query(query);
}
module.exports = { connectDB, queryDB, executeQuery};

// async function queryDB(query, params = {}) {
//     try {
//         const pool = await connectDB();
//         const request = pool.request();

//         // 設定參數
//         for (const [key, value] of Object.entries(params)) {
//             request.input(key, value);
//         }

//         const result = await request.query(query);
//         return result.recordset; // 返回資料集
//     } catch (err) {
//         console.error("Query execution failed:", err);
//         throw err;
//     }
// }
// sql.connect(config, err => {
//     if (err) {
//         throw err;
//     }
//     console.log("Connection Successful!");
// });
// // Define route for fetching data from SQL Server
// app.get("/", (request, response) => {
//     // Execute a SELECT query
//     new sql.Request().query("SELECT * FROM userdata", (err, result) => {
//         if (err) {
//             console.error("Error executing query:", err);
//         } else {
//             response.send(result.recordset); // Send query result as response
//             console.dir(result.recordset);
//         }
//     });
// });
// // Start the server on port 3000
// app.listen(8888, () => {
//     console.log("Listening on port 8888...");
// });