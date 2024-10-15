const express = require("express")
const path = require("path")
const fs = require('fs')
const bodyParser = require("body-parser")
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, 'public')));

//解析表單數據，將數據放到req.body中
app.use(bodyParser.urlencoded({extended: true}))

//處理表單資訊
app.post('/submit_form', (req,res) => {
    const data = req.body
    const filepath = path.join(__dirname, `./database/form-data.json`)

    let redirectPage = '/page.html'

    console.log(data)
    fs.readFile(filepath,'utf8', (err,fileData) => {
        if(err && err.code !== 'ENOENT'){//忽略ENOENT文件不存在的錯誤，第一次輸入資料時創建檔案
            return res.status(500).json({message: 'Error reading file'})
        }
        
        let jsonData = []
        if(fileData){
            jsonData = JSON.parse(fileData);
        }

        jsonData.push(data)
        //如果文件不存在，fs.writeFile 會創建一個新文件；如果文件已存在，會加入內容
        //讀取jsonData的內容，將資料寫入filepath路徑的檔案裡
        fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
            if(err){
                return res.status(500).json({message: 'Error writing to file'});
            }
            res.redirect(redirectPage)
        })
    })
})

//讀取JSON檔數據並回傳
app.get('/get-data', (req, res) => {
    const filepath = path.join(__dirname, './database/form-data.json');

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

app.listen(port,() => {
    console.log("server is running on port 3000")
})