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

        row.appendChild(createCell(item.name));
        row.appendChild(createCell(item.price));
        
        //將行加入tbody中
        tableBody.appendChild(row);
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
        // const filteredData = searchValue ? searchTableData(tableData, searchValue, searchFields) : tableData;
        const filteredData = searchTableData(tableData, searchValue, searchFields);

        console.log('Filtered data:', filteredData);

        //將符合搜尋的資料渲染在表格上
        rendertable(filteredData, tableBodyId);
    });
}
