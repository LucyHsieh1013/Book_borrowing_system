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

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        console.log("帳號",row.password)
        tr.innerHTML = `
            <td style="vertical-align: middle;">${index + 1}</td>
            <td style="vertical-align: middle;">${row.bookindex}</td>
            <td style="vertical-align: middle;">${row.bookname}</td>
            <td style="vertical-align: middle;">${row.auther}</td>
            <td style="vertical-align: middle;">${row.publishing}</td>
            <td style="vertical-align: middle;">${row.year}</td>
            <td style="vertical-align: middle;">${row.status}</td>
        `;
        
        tableBody.appendChild(tr);
    });
}
//書籍新增表單
async function booksubmit(e) {
    e.preventDefault();
    
    const form = document.getElementById('bookform');
    const formData = new FormData(form);
    console.log("form:",form)

    const newbook = {
        bookindex: formData.get('bookindex'),
        bookname: formData.get('bookname'),
        auther: formData.get('auther'),
        publishing: formData.get('publishing'),
        year: formData.get('year'),
        status: formData.get('status')
    };
    console.log("新書資料:",newbook)
    
    await sendbookdata(formData, newbook)
    form.reset();
}
async function sendbookdata(formData, newbook) {
    try{
        const response = await fetch('/adddata/book', {
            method: 'POST',
            body: formData
        })

        const result = await response.json();
        console.log('後端回應:', result);

        if (response.ok) {
            alert(result.message); // 顯示成功訊息
        } else {
            alert(result.error); // 顯示錯誤訊息
        }
        console.log('newbook:',newbook)
        AddtotableData(newbook)
    } catch (error) {
        console.error('發生錯誤:',  error.message || error);
    }
}

//將新增的資料存到tableData
function AddtotableData(newbook){
    tableData.push(newbook);
    console.log("目前書單:", tableData)

    rendertable(tableData, 'showbooks')
}
//帳號畫面渲染-------------------------------------------------------------
function renderaccounttable(data, tableId){
    console.log(data)
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';

    data.forEach((row, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.userindex}</td>
            <td>${row.account}</td>
            <td>${row.role}</td>
        `;

        tableBody.appendChild(tr);
    });
}

async function accountsubmit(e) {
    e.preventDefault();

    const userindex = document.getElementById('userindex').value;
    const account = document.getElementById('account').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const newaccount = {
        userindex,
        account,
        password,
        role
    };

    console.log("新帳號資料:", newaccount)
    
    await sendaccountdata(newaccount)

    //清空表單
    document.getElementById('accountform').reset();
}

async function sendaccountdata(newaccount) {
    try{
        const response = await fetch('/adddata/account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newaccount),
        })

        const result = await response.json();
        console.log('後端回應:', result);

        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.error);
        }
        console.log('newaccount',newaccount)
        AddtoaccountData(newaccount)
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