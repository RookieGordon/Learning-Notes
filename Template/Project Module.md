<%*
let fileDirPath = tp.file.folder(true);
let projectName = fileDirPath.split('/')[paths.length - 2];
let moduleName = tp.file.title;

let newComponentName = `${projectName}ModuleDataView`;
let vaultPath = tp.user.getVaultPath(tp.file.path(), tp.app.vault.getName());
tp.user.copyComponent(vaultPath, "ProjectModuleDataView", newComponentName);
-%>
---
tags: <%projectName%>/<%moduleName%>
type: Project
project: <%projectName%>
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
finished: false

---

# <%moduleName%>模块设计思路
 *TODO*
 
![[<%newComponentName%>.components]]


