<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
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
![[ProjectDataView.components]]