// 原地拷贝componentFilePath文件，并且重命名为newName
function copyComponentFile(VaultPath, componentName, newDir, newName) {
    const fs = require('fs');
    const path = require('path');
    let oldFilePath = path.join(VaultPath, "components/view", `${componentName}.components`);
    let newFilePath = path.join(VaultPath, `${newDir}/${newName}.components`);
    // 判断newFilePath的文件夹是否存在
    let newDirPath = path.dirname(newFilePath);
    if (!fs.existsSync(newDirPath)) {
        fs.mkdirSync(newDirPath, { recursive: true });
    }
    console.log(`Prepare copy ${oldFilePath} to ${newFilePath}`);
    fs.copyFile(oldFilePath, newFilePath, (err) => {
        if (err) {
            throw err;
        }
        console.log('文件拷贝成功!');
    });
}
module.exports = copyComponentFile;
