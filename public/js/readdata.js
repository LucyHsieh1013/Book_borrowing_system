
//從後端取得登入者資料
async function Identity() {
    try {
        const response = await fetch('/api/user-info');
        if (!response.ok) {
            throw new Error("未登入或取得資料失敗");
        }

        const data = await response.json();
        console.log(data); // 確認資料正確
        return data; // 回傳資料到調用處
    } catch (error) {
        console.error("Error fetching user info:", error);
        window.location.href = '/login'; // 未登入時跳轉回登入頁
    }
}
async function fetchUserInfo() {
    const userInfo = await Identity();
    return new Promise((resolve) => {
        setTimeout(() => resolve(userInfo), 100);
    });
}
//用於前端登入後呼叫函式將使用者資料存入localstorage
async function storeUserInfo() {
    try {
        const userInfo = await fetchUserInfo();
        if (userInfo) {
            const { account, userindex } = userInfo;

            // 存入localStorage
            localStorage.setItem('userInfo', JSON.stringify({ account, userindex }));

            console.log("User account saved to LocalStorage:", account);
            console.log("User Index saved to LocalStorage:", userindex);
        }
    } catch (error) {
        console.error("Error storing user info:", error);
    }
}

//創建表格td元素
function createCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    return cell;
}

//將數據顯示在表格中
function rendertable(data, tableId){
    const booktable = document.getElementById(tableId);
    booktable.innerHTML = '';
    let bookrow;
    console.log(data)
    
    data.forEach((book, index) =>{
        if(index %3 === 0){
            bookrow = document.createElement('tr');
            booktable.appendChild(bookrow)
        }

        const td = document.createElement('td');
        td.innerHTML=`
            <a class="booklist" href="borrow?index=${book.bookindex}">
                <img src="${book.picture}" class="img-fluid" style="max-width: 150px; height: auto;"><br>
                <div>${book.bookname}</div>
            </a>
        `;

        bookrow.appendChild(td);
    });
}

//搜尋
function searchTableData(data, searchValue, searchFields){
    const lowerSearchValue = searchValue.toLowerCase();
    console.log(data)
    return data.filter(item =>
        searchFields.some(field => String(item[field]).toLowerCase().includes(lowerSearchValue))
    );
}

function searchForm(formId, searchInputId, tableBodyId, tableData, searchFields){
    document.getElementById(formId).addEventListener('submit', function(event){
        event.preventDefault();

        const searchValue = document.getElementById(searchInputId).value;

        console.log('search: ', searchValue);

        // 符合搜尋的資料
        const filteredData = searchTableData(tableData, searchValue, searchFields);

        console.log('Filtered data:', filteredData);

        //將符合搜尋的資料渲染在表格上
        rendertable(filteredData, tableBodyId);
    });
}

//borrow畫面渲染
function renderBookData(bookindex){
    fetch('/data/booksdata')
        .then(response => response.json())
        .then(data => {
            console.log("bookindex",bookindex)
            const item = data.find(item => item.bookindex === bookindex);
            console.log("item",item)
            console.log("data",data)
            const isBorrowed = item.status === "已被預約";
            if (item){
                console.log("找到資料")

                document.getElementById('bookdata').innerHTML = `
                    <div class="row pt-2">
                        <div class="col-md-4 d-flex justify-content-center">
                            <img src="${item.picture}" class="img-fluid" style="max-width: 28vw; height: auto;"> 
                        </div>
                        <div class="col-md-8 p-2">
                            <div class="h3">書名: ${item.bookname}</div>
                            <div>出版社: ${item.publishing}</div>
                            <div>作者: ${item.auther}</div>
                            <div>出版年份: ${item.year}</div>
                            <div>出借狀態: ${item.status}</div>
                            <form id="borrow">
                                <button class="btn mt-2 ${isBorrowed ? "btn-secondary" : "btn-outline-success"}"
                                    ${isBorrowed ? "disabled" : ""}>
                                    ${isBorrowed ? "已被預約" : "預約"}
                                </button>
                            </form>
                        </div>
                    </div>
                    `;
            }else{
                document.getElementById('bookdata').textContent = '未找到資料'
            }
            if (!isBorrowed) {
                document.getElementById('borrow').addEventListener('click', (e) =>{
                    e.preventDefault();

                    const currentDate = new Date();
                    const borrowingtime = currentDate.toLocaleDateString();
                    console.log("bookindex:", bookindex, borrowingtime)
                    Borrowingstatus("borrow", bookindex, borrowingtime)
                })
            }
        })
        .catch(error => {
            console.error('Error fetching data', error);
        })
}
//---------------------------------------------------------------------
//更新書籍狀態
async function Borrowingstatus(buttonId, bookindex, borrowingtime){
    const userInfo = await Identity();
    const userindex = userInfo.userindex
    console.log("借書人userindex",userindex)
    
    try{
        const response = await fetch(`/update/${buttonId}`,{
            method:"PUT",
            headers:{
                "content-Type":"application/json",
            },
            body: JSON.stringify({ bookindex, userindex, borrowingtime}),
        })
        const result = await response.json();
        if (response.ok) {
            alert(result.message); 
            renderBookData(bookindex);
        } else {
            alert(`更新失敗: ${result.error}`);
        }
    }catch (error) {
        console.error("更新失敗:", error);
    }
}
//---------------------------------------------------------------------
//header
function Header() {
    document.addEventListener("DOMContentLoaded", () => {
        fetch("/header.html")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to load header");
                return response.text();
            })
            .then((html) => {
                document.getElementById("header-container").innerHTML = html;
                
                //使用者名稱渲染
                const checkAccount = setInterval(() => {
                    let storedUserInfo = localStorage.getItem('userInfo');

                    let { account } = JSON.parse(storedUserInfo);
                    console.log("Printaccount", account);
                    if (account) {
                        document.getElementById('userAccount').textContent = account;
                        clearInterval(checkAccount); 
                    }
                }, 50);
                // 登出事件
                document.querySelector("#header-container").addEventListener('click', async (event) => {
                    if (event.target && event.target.id === 'logout') {
                        event.preventDefault(); 

                        try {
                            const response = await fetch('/logout'); 
                            if (response.ok) {
                                localStorage.clear();
                                console.log("LocalStorage 已清除");
                                window.location.href = '/'; // 重定向到登入頁面
                            } else {
                                alert("登出失敗，請稍後再試。");
                            }
                        } catch (error) {
                            console.error("登出過程中出現錯誤:", error);
                            alert("登出時發生錯誤，請稍後再試。");
                        }
                    }
                });
            })
            .catch((error) => console.error(error));
    });
}

//record表格渲染-------------------------------------------------------------------------------------
async function fetchAndRenderRecord() {
    try {
        const storedUserInfo = localStorage.getItem('userInfo');

        if (storedUserInfo) {
            const { userindex } = JSON.parse(storedUserInfo);
            console.log("User Index from LocalStorage:", userindex);

            const response = await fetch(`/data/record/${userindex}`);
            const data = await response.json();
            console.log("Fetched record data:", data);

            // 渲染表格
            renderrecordtable(data, 'showrecord',userindex);
        } else {
            console.warn("No user info found in LocalStorage.");
        }
    } catch (error) {
        console.error("Error fetching or rendering record data:", error);
    }
}

//創建表格td元素
function createCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    return cell;
}
//將數據顯示在表格中
async function renderrecordtable(data, tableId, userindex){
    console.log("資料",data)
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        const isreserve = row.record === "已取消預約";

        tr.innerHTML = `
            <td style="vertical-align: middle;">${index + 1}</td>
            <td style="vertical-align: middle;">${row.bookname}</td>
            <td style="vertical-align: middle;">${row.borrowingtime}</td>
            <td style="vertical-align: middle;">${row.record}</td>
            <td class="d-flex justify-content-center">
                <form id="reserve">
                    <button class="btn mt-2 ${isreserve ? "btn-secondary" : "btn-outline-success"}"
                        ${isreserve ? "disabled" : ""}>
                        ${isreserve ? "已取消預約" : "取消預約"}
                    </button>
                </form>
            </td>
        `;

        const returnButton = tr.querySelector('#reserve');
        returnButton.addEventListener('click', () => {
            updaterecord(userindex, row.bookindex, returnButton, tr);
        });

        tableBody.appendChild(tr);
    });
}
//更新record
async function updaterecord(userindex, bookindex, returnButton, tr) {
    console.log(userindex, bookindex);
    const response = await fetch('/update-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userindex: userindex,
            bookindex: bookindex,
        }),
    });

    const result = await response.json();

    if (result.success) {
        returnButton.innerText = '已取消預約';
        const actionCell = tr.querySelector('#return');
        if (returnButton.innerText === '已取消預約') {
            actionCell.remove();
        }
        alert('已取消預約！');
    } else {
        alert('取消預約失敗：' + result.message);
    }
}

