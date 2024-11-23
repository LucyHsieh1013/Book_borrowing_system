const express = require("express")
const path = require("path")
const fs = require('fs')
const bodyParser = require("body-parser")
const { queryDB } = require('./db');
const cors = require('cors');

const app = express()
const port = 3000

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(cors())

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
app.use(bodyParser.json());

//database連線--------------------------------------------------------
app.get("/data", async (req, res) => {
    // Execute a SELECT query
    try {
        const result = await queryDB("SELECT * FROM userdata"); // 執行查詢
        res.json(result.recordset); // 將結果回傳至客戶端
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Failed to fetch data from the database" });
    }
});
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

//讀取json檔數據並回傳--------------------------------------------------------
app.get('/get-data/:type', (req, res) => {
    const datatype = req.params.type
    const filepath = path.join(__dirname, `./database/${datatype}-data.json`);

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

//manager新增數據到json
app.post('/add-data/:type', (req,res) => {
    const datatype = req.params.type
    const data = req.body
    const filepath = path.join(__dirname, `./database/${datatype}-data.json`)

    console.log(`${datatype}資料:`,data);

    fs.readFile(filepath,'utf8', (err,fileData) => {
        if(err && err.code !== 'ENOENT'){//忽略ENOENT文件不存在的錯誤，第一次輸入資料時創建檔案
            return res.status(500).json({message: 'Error reading file'})
        }
        
        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        if(datatype === 'books'){
            const newBookData = {
                ...data,
                status: "尚在館內"
            };
            jsonData.push(newBookData)
            resMessage = { message: '書籍新增成功', data: newBookData }
        }else{
            jsonData.push(data)
            resMessage = { message: '帳號新增成功', data: data }
        }
        
        //如果文件不存在，fs.writeFile 會創建一個新文件；如果文件已存在，會加入內容
        //讀取jsonData的內容，將資料寫入filepath路徑的檔案裡
        fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
            if(err){
                return res.status(500).json({message: 'Error writing to file'});
            }

            res.json(resMessage);
        })
    })
})
//資料庫連接-------------------------------------------------------------------

//----------------------------------------------------------------

app.listen(port,() => {
    console.log("server is running on port 3000")
})