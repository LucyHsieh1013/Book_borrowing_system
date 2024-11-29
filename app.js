const express = require("express")
const path = require("path")
const fs = require('fs')
const bodyParser = require("body-parser")
const { queryDB, executeQuery } = require('./db');
const cors = require('cors');
const session = require('express-session');
const multer = require("multer");

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

app.get('/api/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "未登入" });
    }

    res.json({ account: req.session.user.account });
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
// async function updateBookYear(bookId, newYear) {
//     const query = `
//         UPDATE Books
//         SET Year = @Year
//         WHERE BookID = @BookID
//     `;
//     const params = { Year: newYear, BookID: bookId };

//     try {
//         const result = await executeQuery(query, params);
//         console.log("Book updated successfully:", result.rowsAffected);
//     } catch (err) {
//         console.error("Error updating book:", err);
//     }
// }

//登入--------------------------------------------------------
app.post('/login', async (req,res) =>{
    const {account, password} = req.body;    
    console.log("帳號:", account)

    try{
        const query = `
            SELECT account, role
            FROM userdata
            WHERE account = @account AND password = @password
        `
        const result = await executeQuery(query,{
            account:account,
            password:password,
        })

        if(result.recordset.length > 0){
            // return res.json({message:"登入成功!", user: {account: result.recordset[0].account} });
            if (result.recordset[0].role === '管理者'){
                return res.redirect('/manager')
            }else{
                req.session.user = { account: result.recordset[0].account };
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

    
    // fs.readFile(filepath, 'utf8', (err,fileData) => {
    //     if(err){
    //         return res.status(500).json({message: "伺服器錯誤，無法讀取資料"})
    //     }

    //     const accounts = JSON.parse(fileData)

    //     const user = accounts.find(
    //         (user) => user.account === account && user.password === password
    //     )

    //     if(user){
    //         return res.json({message: "登入成功!", user:{account: user.account} })
    //     }else{
    //         return res.status(400).json({message: "帳號或密碼錯誤"})
    //     }
    // })
})

//讀取json檔數據並回傳--------------------------------------------------------
// app.get('/get-data/:type', async(req, res) => {
//     const datatype = req.params.type
//     const filepath = path.join(__dirname, `./database/${datatype}-data.json`);

//     fs.readFile(filepath, 'utf8', (err, fileData) => {
//         if(err){
//             return res.status(500).json({message: 'Error reading file'});
//         }

//         let jsonData = []
//         if(fileData){
//             jsonData = JSON.parse(fileData);
//         }

//         // console.log(jsonData);
//         res.json(jsonData);
//     })
// })

//manager新增數據到json
// app.post('/add-data/:type', (req,res) => {
//     const datatype = req.params.type
//     const data = req.body
//     const filepath = path.join(__dirname, `./database/${datatype}-data.json`)

//     console.log(`${datatype}資料:`,data);

//     fs.readFile(filepath,'utf8', (err,fileData) => {
//         if(err && err.code !== 'ENOENT'){//忽略ENOENT文件不存在的錯誤，第一次輸入資料時創建檔案
//             return res.status(500).json({message: 'Error reading file'})
//         }
        
//         let jsonData = []
//         if(fileData){
//             jsonData = JSON.parse(fileData);
//         }

//         if(datatype === 'books'){
//             const newBookData = {
//                 ...data,
//                 status: "尚在館內"
//             };
//             jsonData.push(newBookData)
//             resMessage = { message: '書籍新增成功', data: newBookData }
//         }else{
//             jsonData.push(data)
//             resMessage = { message: '帳號新增成功', data: data }
//         }
        
//         //如果文件不存在，fs.writeFile 會創建一個新文件；如果文件已存在，會加入內容
//         //讀取jsonData的內容，將資料寫入filepath路徑的檔案裡
//         fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
//             if(err){
//                 return res.status(500).json({message: 'Error writing to file'});
//             }

//             res.json(resMessage);
//         })
//     })
// })
//資料庫連接-------------------------------------------------------------------

//----------------------------------------------------------------

app.listen(port,() => {
    console.log("server is running on port 3000")
})