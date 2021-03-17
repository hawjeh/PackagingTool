const { ipcRenderer, shell } = require('electron');
const shellexec = require('child_process').exec;
const Store = require('electron-store');
const store = new Store();
const p = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;

selectFolder = (type) => {
    let resp = ipcRenderer.sendSync('open-directory');
    if (resp && resp.filePaths && resp.filePaths.length > 0) {
        let path = resp.filePaths[0];
        store.set('repo.' + type, path);
        return path;
    }
    return '';
};

errorHandler = (err) => {
    if (err) console.log(err);
};

showSelectedFolderBranches = (path) => {
    shellexec('cd ' + path + ' && git config http.sslVerify false && git branch', (error, stdout) => {
        errorHandler(error);
        showSelectedFolderBranchesCallback(error, path, stdout);
    });
};

checkoutBranch = (path, branch) => {
    shellexec('cd ' + path + ' && git checkout ' + branch + ' && git pull', (error) => {
        errorHandler(error);
        checkoutBranchCallback(error, path, branch);
    });
};

loadCommit = (path, branch) => {
    store.set('repo.branch', branch);
    shellexec('cd ' + path + ' && git log -15 --pretty=oneline --first-parent ' + branch, (error, stdout) => {
        errorHandler(error);
        reloadedCommit(error, stdout);
    });
};

loadFileChange = (path, begin, recent) => {
    shellexec('cd ' + path + ' && git diff --diff-filter=ACMRT ' + begin + ' ' + recent + ' --name-only', (error, stdout) => {
        errorHandler(error);
        showFileChange(error, path, stdout);
    });
};

packageFile = (destPath, sourcePath, files) => {
    fsPromise
        .rmdir(destPath, { recursive: true })
        .then(() => {
            files.forEach((v, i) => {
                let source = p.join(sourcePath, v);
                let dest = p.join(destPath, v);
                let dir = dest.match(/(.*)[\/\\]/)[1] || '';
                if (!fs.existsSync(dir)) {
                    fsPromise.mkdir(dir, { recursive: true }).then(() => copyOver(source, dest));
                } else {
                    copyOver(source, dest);
                }
                if (i === files.length - 1) {
                    packageFileCallBack(destPath);
                }
            });
        })
        .catch((err) => {
            console.log(err);
            packageFileCallBack(destPath, err);
        });
};

copyOver = (source, dest) => {
    fs.copyFile(source, dest, (err) => err && console.log(err));
};

openFolder = (dest) => {
    setTimeout(() => {
        shell.showItemInFolder(dest);
    }, 1000);
};

reloadSetting = () => {
    return store.get('repo');
};
