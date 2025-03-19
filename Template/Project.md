<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
console.log(`项目文件夹：${fileDirPath}`);
let newComponentName = `${projectName}_DataView`;
let vaultPath = tp.user.getVaultPath(tp.file.path(), tp.app.vault.getName());
tp.user.copyComponent(vaultPath, "ProjectDataView", `${fileDirPath`, newComponentName);

//![[<%newComponentName%>.components]]
-%>
---
tags: <%projectName%>
type: Project
project: <%projectName%>
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
cssclasses: editor-full

---
