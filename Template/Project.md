<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
let newComponentName = `${projectName}_DataView`;
let vaultPath = tp.user.getVaultPath(tp.file.path(), tp.app.vault.getName());
tp.user.copyComponent(vaultPath, "ProjectDataView", `${fileDirPath}/components`, newComponentName);
-%>
---
tags: <%projectName%> home
type: Project
project: <%projectName%>
projectType: Project
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
cssclasses: editor-full

---
![[<%newComponentName%>.components]]