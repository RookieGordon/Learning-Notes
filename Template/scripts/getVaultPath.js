function getVaultPath(filePath, vaultName) {
    filePath = filePath.replace(/\\/g, '/');
    let l = filePath.split('/');
    let path = '';
    for (let index = 0; index < l.length; index++) {
        const element = l[index];
        path += element + '/';
        if (element === vaultName) {
            return path;
        }
    }
    return path;
}

module.exports = getVaultPath;
