function getVaultPath() {

}

// 原地拷贝componentFilePath文件，并且重命名为newName
function copyComponentFile(VaultPath, componentName, newName) {
    VaultPath.replace(/\\/g, "/");
    VaultPath = VaultPath.split("/");
    const fs = require('fs');
    let oldFilePath = path.join(VaultPath, "components/vies", componentName, ".components");
    let newFilePath = path.join(VaultPath, "components/vies", newName, ".components");
    console.log(`Prepare copy ${oldFilePath} to ${newFilePath}`);
    fs.copyFile(oldFilePath, newFilePath, (err) => {
        if (err) {
            throw err;
        }
        console.log('文件拷贝成功!');
    });
}
module.exports = copyComponentFile;
