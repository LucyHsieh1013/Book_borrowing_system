const express = require("express")
const path = require("path")
// const fs = require('fs')
const bodyParser = require("body-parser")
const { queryDB, executeQuery } = require('./db');
const cors = require('cors');
const session = require('express-session');
const multer = require("multer");
const sql = require("mssql");

const app = express()
const port = 3000

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(cors())
app.use(session({
    secret: 'testSecretForDevOnly',
    resave: false, 
    saveUninitialized: false, 
    cookie: { secure: false } 
}));
//----------------------------------------------
const uploadFolder = path.join(__dirname, "./public/picture");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    },
});
const upload = multer({ storage });
//--------------------------------------------------
app.get('/book', (req, res) => {
    console.log('Session:', req.session);
    if (!req.session || !req.session.user) {
        return res.redirect('/login'); // 未登入，跳回登入頁面
    }
    res.sendFile(path.join(__dirname, 'public', 'books.html'));
});
app.get('/borrow', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'borrow.html'));
});
app.get('/manager', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manager.html'));
});
app.get('/record', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'record.html'));
});

app.get('/api/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "未登入" });
    }

    res.json({ account: req.session.user.account, userindex: req.session.user.userindex});
});
//解析表單數據，將數據放到req.body中
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());


//抓取database資料--------------------------------------------------------
app.get("/data/:type", async (req, res) => {
    const datatype = req.params.type
    console.log(datatype)
    // Execute a SELECT query
    try {
        const result = await queryDB(`SELECT * FROM ${datatype}`); 
        res.json(result.recordset);
        console.log(result.recordset)
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Failed to fetch data from the database" });
    }
});
//record抓取對應使用者資料
app.get("/data/record/:userindex", async (req, res) => {
    const userindex = req.params.userindex;
    console.log("後端",userindex)
    try {

        const query = `
            SELECT * FROM record 
            WHERE userindex = @userindex
            ORDER BY 
                CASE 
                    WHEN record = '已預約' THEN 1 
                    ELSE 2 
                END;
        `;
        const params = {
            userindex: userindex
        };
        const result = await executeQuery(query,params)
        const records = result.recordset;

        const recordsWithBookNames = await Promise.all(records.map(async (record) => {
            const bookindex = record.bookindex;
            
            // 使用預存程序傳bookindex找bookname
            const bookResult = await executeQuery('EXEC GetBookByIndex @bookindex', {
                bookindex: bookindex
            });
            console.log(bookResult.recordset[0])
            const bookname = bookResult.recordset[0]?.bookname || '未知书名'; // 如果没有找到书名，返回 '未知书名'
            
            return {
                ...record,
                bookname: bookname
            };
        }));

        console.log("Updated records with book names:", recordsWithBookNames);
        
        res.json(recordsWithBookNames);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Failed to fetch data from the database" });
    }
});

//關鍵字搜尋database資料--------------------------------------------------------
app.post('/search', async(req,res) =>{
    const searchQuery = req.body.search
    console.log('searchQuery',searchQuery)
    if(!searchQuery){
        return res.status(400).json({error:'Query parameter is required'})
    }

    try{
        const sql = `
            SELECT bookname, picture 
            FROM booksdata
            WHERE bookname LIKE '%${searchQuery}%'
        `;

        // 使用參數化查詢避免 SQL 注入
        const results = await queryDB(sql);
        console.log('查詢結果',results)
        res.json(results);
    }catch (error) {
        console.error('Error fetching data from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
//新增修改數據--------------------------------------------------------
app.post("/adddata/:type", upload.single("picture"), async (req, res) => {
    const datatype = req.params.type
    console.log(datatype)
    
    let query;
    let params;

    if(datatype === 'account'){
        const { userindex, account, password, role } = req.body;

        query = `
            INSERT INTO userdata (userindex, account, password, role)
            VALUES (@userindex, @account, @password, @role)
        `;

        params = {
            userindex: userindex,
            account: account,
            password: password,
            role: role
        };
    }else if(datatype === 'book'){
        const { bookindex, bookname, auther, publishing, year, status} = req.body;

        const picture = req.file ? `/picture/${req.file.filename}` : "無";

        query = `
            INSERT INTO booksdata (bookindex, bookname, auther, publishing, year, picture, status)
            VALUES (@bookindex, @bookname, @auther, @publishing, @year, @picture, @status)
        `;

        params = {
            bookindex: bookindex,
            bookname: bookname,
            auther: auther,
            publishing: publishing,
            year: year,
            picture: picture,
            status: status
        };
    }
    
    console.log("params",params)
    try {
        await executeQuery(query, params);
        res.status(200).json({ message: `${datatype}新增成功！` });
    } catch (err) {
        console.error(`新增${datatype}時發生錯誤:`, err);
        res.status(500).json({ error: `無法新增${datatype}。` });
    }
});
//借閱---------------------------------------------------------
app.put("/update/:type", async(req,res) =>{
    const datatype = req.params.type
    console.log("app datatype:", datatype)
    const {bookindex, userindex, borrowingtime} = req.body
    console.log("app bookindex",bookindex, userindex, borrowingtime)

    const newStatus = datatype === "borrow" ? "已被預約" : "尚在館內";
    console.log("app newStatus",newStatus)

    //booksdata狀態變更
    const query = `
        UPDATE booksdata
        SET status = @newStatus
        WHERE bookindex = @bookindex
    `;
    const params = {newStatus, bookindex}
    

    //寫入record
    const insertRecordQuery = `
        INSERT INTO record (userindex, bookindex, borrowingtime, record)
        VALUES (@userindex, @bookindex, @borrowingtime, @record)
    `;
    const insertparams = {userindex, bookindex, borrowingtime, record:'已預約'}
    
    
    console.log("params",params)

    try {
        await executeQuery(query, params);
        await executeQuery(insertRecordQuery, insertparams);

        res.status(200).json({ message: `${datatype}更新成功！` });
    } catch (err) {
        console.error(`更新${datatype}時發生錯誤:`, err);
        res.status(500).json({ error: `無法更新${datatype}。` });
    }

})
//還書---------------------------------------------------
app.post('/update-record', async (req, res) => {
    const { userindex, bookindex } = req.body;

    console.log("還書資料",userindex,bookindex)
    try {
        const query = `
            UPDATE record
            SET record = '已取消預約'
            WHERE userindex = @userindex AND bookindex = @bookindex
        `;
        
        const result = await executeQuery(query, 
            {
                userindex: userindex,
                bookindex: bookindex,
            }
        );

        //booksdata狀態變更
        const booksdataquery = `
            UPDATE booksdata
            SET status = '尚在館內'
            WHERE bookindex = @bookindex
        `;
        const booksdataparams = {bookindex}
        await executeQuery(booksdataquery, booksdataparams);


        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: 'Record updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Record not found.' });
        }
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});
//登入--------------------------------------------------------
app.post('/login', async (req,res) =>{
    const {account, password} = req.body;    
    console.log("帳號:", account)

    try{
        const query = `
            SELECT account, role, userindex
            FROM userdata
            WHERE account = @account AND password = @password
        `
        const result = await executeQuery(query,{
            account:account,
            password:password,
        })

        if(result.recordset.length > 0){
            const user = result.recordset[0];
            if (user.role === '管理者'){
                return res.redirect('/manager')
            }else{
                req.session.user = { account: user.account, userindex: user.userindex};
                return res.redirect('/book')
            }
            
        }else{
            console.error("登入時發生錯誤:", err);
            return res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
        }
    }catch (err) {
        console.error("登入時發生錯誤:", err);
        return res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
    }
})
//登出----------------------------------------------------
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session 銷毀失敗:", err);
            return res.status(500).send("登出失敗");
        }
        res.clearCookie('connect.sid'); // 清除 session cookie
        res.redirect('/'); // 導向登入頁面
    });
});

//---------------------------------------------------------
app.listen(port,() => {
    console.log("server is running on port 3000")
})