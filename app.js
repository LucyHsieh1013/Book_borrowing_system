const express = require("express")
const path = require("path")
const fs = require('fs')
const bodyParser = require("body-parser")
// const session = require("express-session")
// const bcrypt = require("bcrypt")
const app = express()
const port = 3000

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/book', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'books.html'));
});
app.get('/borrow', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'borrow.html'));
});
app.get('/manager', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manager.html'));
});
//解析表單數據，將數據放到req.body中
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.json());
//登入--------------------------------------------------------
app.post('/login', (req,res) =>{
    const {account, password} = req.body;
    const filepath = path.join(__dirname, './database/account-data.json')

    console.log("帳號密碼:",account, password)
    fs.readFile(filepath, 'utf8', (err,fileData) => {
        if(err){
            return res.status(500).json({message: "伺服器錯誤，無法讀取資料"})
        }

        const accounts = JSON.parse(fileData)

        const user = accounts.find(
            (user) => user.account === account && user.password === password
        )

        if(user){
            return res.json({message: "登入成功!", user:{account: user.account} })
        }else{
            return res.status(400).json({message: "帳號或密碼錯誤"})
        }
    })
})

//book.html讀取books-data.json檔數據並回傳--------------------------------------------------------
app.get('/get-bookdata', (req, res) => {
    const filepath = path.join(__dirname, './database/books-data.json');

    fs.readFile(filepath, 'utf8', (err, fileData) => {
        if(err){
            return res.status(500).json({message: 'Error reading file'});
        }

        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        // console.log(jsonData);
        res.json(jsonData);
    })
})

//manager.html新增書籍到books-data.json
app.post('/AddBook', (req,res) => {
    const data = req.body
    const filepath = path.join(__dirname, `./database/books-data.json`)

    console.log("書籍資料:",data);

    fs.readFile(filepath,'utf8', (err,fileData) => {
        if(err && err.code !== 'ENOENT'){//忽略ENOENT文件不存在的錯誤，第一次輸入資料時創建檔案
            return res.status(500).json({message: 'Error reading file'})
        }
        
        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        const newBookData = {
            ...data,
            status: "尚在館內"
        };

        jsonData.push(newBookData)
        //如果文件不存在，fs.writeFile 會創建一個新文件；如果文件已存在，會加入內容
        //讀取jsonData的內容，將資料寫入filepath路徑的檔案裡
        fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
            if(err){
                return res.status(500).json({message: 'Error writing to file'});
            }

            res.json({ message: '書籍新增成功', data: newBookData });
        })
    })
})

//manager.html讀取account-data.json檔數據並回傳--------------------------------------------
app.get('/get-accountdata', (req, res) => {
    const filepath = path.join(__dirname, './database/account-data.json');

    fs.readFile(filepath, 'utf8', (err, fileData) => {
        if(err){
            return res.status(500).json({accountmessage: 'Error reading file'});
        }

        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        // console.log(jsonData);
        res.json(jsonData);
    })
})
//manager.html新增帳號到account-data.json
app.post('/AddAccount', (req,res) => {
    // const {account, password} = req.body
    const data = req.body
    const filepath = path.join(__dirname, `./database/account-data.json`)
    console.log("帳號資料:",data);

    fs.readFile(filepath,'utf8', (err,fileData) => {
        if(err && err.code !== 'ENOENT'){//忽略ENOENT文件不存在的錯誤，第一次輸入資料時創建檔案
            return res.status(500).json({accountmessage: 'Error reading file'})
        }
        // const hashedPassword = await hashPassword(password);
        // const newaccount = {
        //     account,
        //     password:hashedPassword
        // }
        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        // jsonData.push(newaccount)
        jsonData.push(data)
        console.log("jsonData:",jsonData)

        //如果文件不存在，fs.writeFile 會創建一個新文件；如果文件已存在，會加入內容
        //讀取jsonData的內容，將資料寫入filepath路徑的檔案裡
        fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
            if(err){
                return res.status(500).json({ accountmessage: 'Error writing to file'});
            }

            res.json({ accountmessage: '帳號新增成功', data: data });
        })
    })
})
//登入驗證-----------------------------------------------------
// app.get('/login',(req,res) =>{

// });
// 設定 session
// app.use(
//     session({
//         secret: "my_secret_key",
//         resave: false,
//         saveUninitialized: false,
//         cookie: { maxAge: 60000 },
//     })
// )
//密碼加密
// async function hashPassword(password) {
//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         console.log("Hashed Password:", hashedPassword);
//         return hashedPassword;
//     } catch (error) {
//         console.error("Hashing Error:", error);
//     }
// }
//--------------------------------------------------------------------------
app.listen(port,() => {
    console.log("server is running on port 3000")
})