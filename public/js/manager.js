//顯示書本資料
//創建表格td元素
function createCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    return cell;
}
//將數據顯示在表格中
function rendertable(data, tableId){
    console.log(data)
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');

        row.appendChild(createCell(item.index));
        row.appendChild(createCell(item.bookname));
        row.appendChild(createCell(item.auther));
        row.appendChild(createCell(item.publishing));
        row.appendChild(createCell(item.year));
        row.appendChild(createCell(item.status));
        
        //將行加入tbody中
        tableBody.appendChild(row);
    });
}

//表單
async function booksubmit(e) {
    e.preventDefault();
    
    const index = document.getElementById('index').value;
    const bookname = document.getElementById('bookname').value;
    const auther = document.getElementById('auther').value;
    const publishing = document.getElementById('publishing').value;
    const year = document.getElementById('year').value;

    const newbook = {
        index,
        bookname,
        auther,
        publishing,
        year
    };
    console.log("新書資料:",newbook)
    
    //將新書資料送到後端
    await sendbookdata(newbook)

    //清空表單
    document.getElementById('bookform').reset();
}

async function sendbookdata(newbook) {
    try{
        const response = await fetch('/add-data/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newbook),
        })

        const result = await response.json();
        console.log('後端回應:', result);

        AddtotableData(result.data)

        document.getElementById('message').textContent = result.message;
        document.getElementById('bookform').reset();
    } catch (error) {
        console.error('發生錯誤:',  error.message || error);
    }
}

//將新增的資料存到tableData
function AddtotableData(newbook){
    tableData.push(newbook);
    console.log("目前書單:", tableData)

    rendertable(tableData, 'showdata')
}
//-------------------------------------------------------------
function renderaccounttable(data, tableId){
    console.log(data)
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');

        row.appendChild(createCell(item.account));
        row.appendChild(createCell(item.password));
        
        //將行加入tbody中
        tableBody.appendChild(row);
    });
}
async function accountsubmit(e) {
    e.preventDefault();
    
    const account = document.getElementById('account').value;
    const password = document.getElementById('password').value;

    const newaccount = {
        account,
        password
    };

    console.log("新帳號資料:", newaccount)
    
    //將新書資料送到後端
    await sendaccountdata(newaccount)

    //清空表單
    document.getElementById('accountform').reset();
}

async function sendaccountdata(newaccount) {
    try{
        const response = await fetch('/add-data/account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newaccount),
        })

        const result = await response.json();
        console.log('後端回應:', result);

        AddtoaccountData(result.data)

        document.getElementById('accountmessage').textContent = result.accountmessage;
        document.getElementById('accountform').reset();
    } catch (error) {
        console.error('發生錯誤:',  error.accountmessage || error);
    }
}

//將新增的資料存到tableData
function AddtoaccountData(newaccount){
    accountData.push(newaccount);
    console.log("目前帳號資料:", accountData)

    renderaccounttable(accountData, 'showaccount')
}