// 原地拷贝componentFilePath文件，并且重命名为newName
function copyComponentFile(VaultPath, componentName, newName) {
    const fs = require('fs');
    const path = require('path');
    let oldFilePath = path.join(VaultPath, "components/view", `${componentName}.components`);
    let newFilePath = path.join(VaultPath, "components/view", `${newName}.components`);
    console.log(`Prepare copy ${oldFilePath} to ${newFilePath}`);
    fs.copyFile(oldFilePath, newFilePath, (err) => {
        if (err) {
            throw err;
        }
        console.log('文件拷贝成功!');
    });
}
module.exports = copyComponentFile;
