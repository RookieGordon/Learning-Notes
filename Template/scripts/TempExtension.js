// 原地拷贝componentFilePath文件，并且重命名为newName
function copyComponentFile(componentFilePath, newName) {
    console.log(`Prepare copy ${componentFilePath}`);
    const fs = require('fs');
    fs.copyFile(componentFilePath, 'target.txt', (err) => {
        if (err) throw err;
        console.log('文件拷贝成功!');
    });
}

module.exports = copyComponentFile;
