
//身分傳遞
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
            const isBorrowed = item.status === "已外借";
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
                                    ${isBorrowed ? "不在館內" : "借閱"}
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
                    
                    console.log("bookindex:", bookindex)
                    Borrowingstatus("borrow", bookindex)
                })
            }
        })
        .catch(error => {
            console.error('Error fetching data', error);
        })
}
//---------------------------------------------------------------------
//更新書籍狀態
async function Borrowingstatus(buttonId, bookindex){
    const userInfo = await Identity();
    const userindex = userInfo.userindex
    console.log("借書人userindex",userindex)
    
    try{
        const response = await fetch(`/update/${buttonId}`,{
            method:"PUT",
            headers:{
                "content-Type":"application/json",
            },
            // body: JSON.stringify({ bookindex}),
            body: JSON.stringify({ bookindex, userindex }),
        })
        const result = await response.json();
        if (response.ok) {
            alert(result.message); // 顯示成功訊息
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
function Header(){
    document.addEventListener("DOMContentLoaded", () => {
        fetch("/header.html")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to load header");
                return response.text();
            })
            .then((html) => {
                document.getElementById("header-container").innerHTML = html;
            })
            .catch((error) => console.error(error));
    });
}

//個人訊息登出鍵
async function displayWelcomeMessage() {
    const userInfo = await Identity();
    console.log("displayWelcomeMessage",userInfo)
    if (userInfo) {
        document.getElementById('welcome-message').innerText = `登出 ${userInfo.account}`;
    }
}
