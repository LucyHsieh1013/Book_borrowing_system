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
            <a href="borrow?index=${book.bookindex}">
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
// function searchForm(formId, searchInputId, tableBodyId, apiEndpoint){
//     document.getElementById(formId).addEventListener('submit', async function(event){
//         event.preventDefault();

//         const searchValue = document.getElementById(searchInputId).value;

//         console.log('search: ', searchValue);

//         try{
//             const response = await fetch(apiEndpoint, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ search: searchValue }) // 將關鍵字放入請求主體
//             });            
//             if (!response.ok) throw new Error('Failed to fetch data from server');

//             const data = await response.json();
//             console.log('searchdata: ', data);

//             rendertable(data, tableBodyId);
//         }catch(error){
//             console.error('Error fetching data',error);
//         }
//     });
// }