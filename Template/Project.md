<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
-%>
---
tags: <%projectName%>
type: Project
project: <%projectName%>
fileDirPath: <%fileDirPath%>
date_start: <%tp.date.now("YYYY-MM-DD")%>
date_finish: <%tp.date.now("YYYY-MM-DD")%>
cssclasses: editor-full

---
![[ProjectDataView.components]]