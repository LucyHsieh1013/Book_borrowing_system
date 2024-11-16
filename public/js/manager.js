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
        const response = await fetch('/AddBook', {
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