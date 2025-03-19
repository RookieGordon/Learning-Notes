<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);

let newComponentName = `{projectName}DataView`;
let vaultPath = tp.app.vault.getRoot();
console.log(`$路径是：{vaultPath}`);
tp.user.copyComponent(vaultPath,"ProjectDataView", newComponentName);
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
![[<%newComponentName%>.components]]