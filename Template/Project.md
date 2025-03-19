<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);

let newComponentName =  `{projectName}DataView`;
console.log();
tp.user.copyComponentFile(tp.app.vault.root,"ProjectDataView", newComponentName);
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